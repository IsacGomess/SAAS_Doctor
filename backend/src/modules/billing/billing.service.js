const Subscription = require('./subscription.model');
const ProcessedWebhookEvent = require('./processed-webhook-event.model');
const User = require('../users/user.model');

const PLAN_PRICES = () => ({
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
  clinic: process.env.STRIPE_PRICE_CLINIC
});

const PROFESSIONAL_ROLES = ['medico', 'enfermeiro', 'fisioterapeuta', 'nutricionista', 'esteticista', 'dentista', 'nutrologo'];
const INCLUDED_SEAT_LIMIT = 5;
const EXTRA_PROFESSIONAL_PRICE_CENTS = 4990;
const WEBHOOK_PROCESSING_LEASE_MS = 60_000;

class BillingService {
  constructor() {
    this._stripeClient = null;
  }

  getStripeClient() {
    if (this._stripeClient) return this._stripeClient;
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) return null;
    this._stripeClient = require('stripe')(apiKey);
    return this._stripeClient;
  }

  getExtraProfessionalPriceId() {
    const priceId = process.env.STRIPE_PRICE_EXTRA_PROFESSIONAL;
    if (!priceId) {
      throw new Error('Configuração de cobrança pendente: STRIPE_PRICE_EXTRA_PROFESSIONAL ausente.');
    }
    return priceId;
  }

  calculateExtraProfessionalSeats(activeProfessionalCount) {
    const total = Number(activeProfessionalCount || 0);
    return Math.max(0, total - INCLUDED_SEAT_LIMIT);
  }

  getBillingCycleLabel(subscription = null) {
    if (subscription?.status === 'trialing' && subscription?.trialEndsAt) {
      return 'após o fim do trial';
    }
    return 'próximo ciclo';
  }

  async getClinicSeatSummary(clinicaId) {
    if (!clinicaId) {
      return {
        clinicaId: null,
        includedSeats: INCLUDED_SEAT_LIMIT,
        activeProfessionalCount: 0,
        extraProfessionals: 0,
        monthlyPriceCents: 0,
        billingCycleLabel: 'próximo ciclo',
        chargeAt: null,
        status: null,
        currentPeriodEnd: null,
        trialEndsAt: null
      };
    }

    const activeProfessionalCount = await User.countDocuments({
      clinicaId,
      isActive: true,
      role: { $in: PROFESSIONAL_ROLES }
    });

    const extraProfessionals = this.calculateExtraProfessionalSeats(activeProfessionalCount);
    const subscription = await Subscription.findOne({ ownerType: 'clinic', ownerId: clinicaId });
    const billingCycleLabel = this.getBillingCycleLabel(subscription);
    const chargeAt = subscription?.status === 'trialing' ? subscription?.trialEndsAt || subscription?.currentPeriodEnd || null : subscription?.currentPeriodEnd || null;

    return {
      clinicaId,
      includedSeats: INCLUDED_SEAT_LIMIT,
      activeProfessionalCount,
      extraProfessionals,
      monthlyPriceCents: extraProfessionals > 0 ? extraProfessionals * EXTRA_PROFESSIONAL_PRICE_CENTS : 0,
      billingCycleLabel,
      chargeAt,
      status: subscription?.status || null,
      currentPeriodEnd: subscription?.currentPeriodEnd || null,
      trialEndsAt: subscription?.trialEndsAt || null
    };
  }

  async getSubscriptionByOwner(ownerType, ownerId) {
    return await Subscription.findOne({ ownerType, ownerId });
  }

  async getCurrentStripeSubscriptionState(stripeSubscription) {
    if (!stripeSubscription || !stripeSubscription.id) {
      return stripeSubscription;
    }

    const stripe = this.getStripeClient();
    if (!stripe) {
      return stripeSubscription;
    }

    try {
      return await stripe.subscriptions.retrieve(stripeSubscription.id, { expand: ['items.data.price'] });
    } catch (error) {
      return stripeSubscription;
    }
  }

  async reserveWebhookEventForProcessing({ eventId, stripeSubscriptionId, ownerType, ownerId, eventCreatedAt }) {
    if (!eventId) {
      return { inserted: true, status: 'processed', shouldProcess: true };
    }

    const now = new Date();
    const leaseExpiresAt = new Date(now.getTime() + WEBHOOK_PROCESSING_LEASE_MS);
    const claimPayload = {
      stripeSubscriptionId,
      ownerType,
      ownerId,
      status: 'processing',
      startedAt: now,
      processingLeaseExpiresAt: leaseExpiresAt,
      eventCreatedAt: eventCreatedAt || new Date(),
      finishedAt: null,
      errorMessage: null
    };

    const existing = await ProcessedWebhookEvent.findOne({ eventId });
    if (existing) {
      if (existing.status === 'processed') {
        return { inserted: false, duplicate: true, status: existing.status, shouldProcess: false };
      }

      if (existing.status === 'processing' && existing.processingLeaseExpiresAt && existing.processingLeaseExpiresAt > now) {
        return { inserted: false, duplicate: false, status: existing.status, shouldProcess: false, existing };
      }

      const claimed = await ProcessedWebhookEvent.findOneAndUpdate(
        {
          eventId,
          $or: [
            { status: { $in: ['pending', 'failed'] } },
            { status: 'processing', processingLeaseExpiresAt: { $lte: now } }
          ]
        },
        { $set: claimPayload },
        { new: true }
      );

      if (claimed) {
        return { inserted: false, duplicate: false, status: 'processing', shouldProcess: true, existing: claimed };
      }

      return { inserted: false, duplicate: false, status: existing.status || 'processing', shouldProcess: false, existing };
    }

    try {
      const created = await ProcessedWebhookEvent.create({
        eventId,
        ...claimPayload
      });

      return { inserted: true, status: 'processing', shouldProcess: true, created };
    } catch (error) {
      if (error && error.code === 11000) {
        const retry = await ProcessedWebhookEvent.findOne({ eventId });
        if (retry && retry.status === 'processed') {
          return { inserted: false, duplicate: true, status: retry.status, shouldProcess: false };
        }

        if (retry && retry.status === 'processing' && retry.processingLeaseExpiresAt && retry.processingLeaseExpiresAt > now) {
          return { inserted: false, duplicate: false, status: retry.status, shouldProcess: false, existing: retry };
        }

        const reclaimed = await ProcessedWebhookEvent.findOneAndUpdate(
          {
            eventId,
            $or: [
              { status: { $in: ['pending', 'failed'] } },
              { status: 'processing', processingLeaseExpiresAt: { $lte: now } }
            ]
          },
          { $set: claimPayload },
          { new: true }
        );

        if (reclaimed) {
          return { inserted: false, duplicate: false, status: 'processing', shouldProcess: true, existing: reclaimed };
        }

        return { inserted: false, duplicate: false, status: retry?.status || 'pending', shouldProcess: false, existing: retry };
      }

      throw error;
    }
  }

  async markWebhookEventAsCompleted({ eventId, stripeSubscriptionId, ownerType, ownerId, errorMessage = null }) {
    if (!eventId) {
      return;
    }

    const update = {
      status: errorMessage ? 'failed' : 'processed',
      finishedAt: new Date(),
      processedAt: errorMessage ? null : new Date(),
      processingLeaseExpiresAt: null,
      errorMessage,
      stripeSubscriptionId,
      ownerType,
      ownerId
    };

    await ProcessedWebhookEvent.findOneAndUpdate({ eventId }, { $set: update }, { new: true });
  }

  async syncStripeSubscription(stripeSubscription, options = {}) {
    if (!stripeSubscription || !stripeSubscription.id) {
      return null;
    }

    const metadata = stripeSubscription.metadata || {};
    const ownerType = metadata.med1peOwnerType || null;
    const ownerId = metadata.med1peOwnerId || null;
    const eventId = options.eventId || null;
    const eventCreatedAt = options.eventCreatedAt ? new Date(options.eventCreatedAt) : null;

    let doc = await Subscription.findOne({ stripeSubscriptionId: stripeSubscription.id });
    if (!doc && ownerType && ownerId) {
      doc = await Subscription.findOne({ ownerType, ownerId });
    }

    const effectiveStripeSubscription = await this.getCurrentStripeSubscriptionState(stripeSubscription);
    const processedEventIds = Array.isArray(doc?.processedWebhookEventIds) ? doc.processedWebhookEventIds : [];
    const isEventOlderThanCurrent = Boolean(
      eventCreatedAt &&
      doc?.lastWebhookProcessedAt &&
      eventCreatedAt.getTime() < new Date(doc.lastWebhookProcessedAt).getTime()
    );

    if (eventId && processedEventIds.includes(eventId)) {
      return doc;
    }

    if (eventId) {
      const eventState = await this.reserveWebhookEventForProcessing({
        eventId,
        stripeSubscriptionId: stripeSubscription.id,
        ownerType: ownerType || doc?.ownerType || null,
        ownerId: ownerId || doc?.ownerId || null,
        eventCreatedAt: eventCreatedAt || null
      });

      if (eventState.duplicate && eventState.status === 'processed') {
        return doc;
      }

      if (eventState.shouldProcess === false) {
        return doc;
      }
    }
    const nextProcessedEventIds = eventId
      ? [...new Set([...(processedEventIds || []), eventId])].slice(-50)
      : (processedEventIds || []);

    const priceId = (
      effectiveStripeSubscription.items &&
      effectiveStripeSubscription.items.data &&
      effectiveStripeSubscription.items.data[0] &&
      effectiveStripeSubscription.items.data[0].price &&
      effectiveStripeSubscription.items.data[0].price.id
    ) || null;

    const planFromPrice = Object.keys(PLAN_PRICES()).find((key) => PLAN_PRICES()[key] === priceId) || null;
    const plan = planFromPrice || metadata.med1pePlan || doc?.plan || null;
    const plannedStatus = effectiveStripeSubscription.status || 'pending';

    const effectiveOwnerType = ownerType || doc?.ownerType || null;
    const effectiveOwnerId = ownerId || doc?.ownerId || null;
    const existingTrialUsed = Boolean(doc?.trialUsed);
    const existingTrialStartedAt = doc?.trialStartedAt || null;
    const existingTrialEndsAt = doc?.trialEndsAt || null;

    const newestProcessedAt = eventCreatedAt && (!doc?.lastWebhookProcessedAt || eventCreatedAt.getTime() >= new Date(doc.lastWebhookProcessedAt).getTime())
      ? eventCreatedAt
      : doc?.lastWebhookProcessedAt || eventCreatedAt || null;

    const finalLastWebhookEventId = isEventOlderThanCurrent && doc?.lastWebhookEventId
      ? doc.lastWebhookEventId
      : (eventId || doc?.lastWebhookEventId || null);

    const update = {
      ownerType: effectiveOwnerType,
      ownerId: effectiveOwnerId,
      stripeSubscriptionId: effectiveStripeSubscription.id,
      stripeCustomerId: effectiveStripeSubscription.customer || doc?.stripeCustomerId || null,
      stripePriceId: priceId,
      plan: plan || doc?.plan || null,
      status: plannedStatus,
      processedWebhookEventIds: nextProcessedEventIds,
      lastWebhookEventId: finalLastWebhookEventId,
      lastWebhookProcessedAt: newestProcessedAt,
      currentPeriodEnd: (
        (effectiveStripeSubscription.items && effectiveStripeSubscription.items.data && effectiveStripeSubscription.items.data[0] && effectiveStripeSubscription.items.data[0].current_period_end)
          ? new Date(effectiveStripeSubscription.items.data[0].current_period_end * 1000)
          : (effectiveStripeSubscription.current_period_end ? new Date(effectiveStripeSubscription.current_period_end * 1000) : doc?.currentPeriodEnd || null)
      ),
      cancelAt: effectiveStripeSubscription.cancel_at
        ? new Date(effectiveStripeSubscription.cancel_at * 1000)
        : null,
      cancelAtPeriodEnd: Boolean(effectiveStripeSubscription.cancel_at_period_end),
      trialUsed: existingTrialUsed,
      trialStartedAt: existingTrialStartedAt,
      trialEndsAt: existingTrialEndsAt
    };

    if (plannedStatus === 'trialing') {
      update.trialUsed = true;
      update.trialStartedAt = effectiveStripeSubscription.trial_start
        ? new Date(effectiveStripeSubscription.trial_start * 1000)
        : existingTrialStartedAt;
      update.trialEndsAt = effectiveStripeSubscription.trial_end
        ? new Date(effectiveStripeSubscription.trial_end * 1000)
        : existingTrialEndsAt;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Stripe subscription sync:', {
        stripeSubscriptionId: effectiveStripeSubscription.id,
        status: effectiveStripeSubscription.status,
        ownerType: effectiveOwnerType,
        ownerId: effectiveOwnerId,
        plan: update.plan,
        trialUsed: update.trialUsed,
        trialEndsAt: update.trialEndsAt,
        isEventOlderThanCurrent
      });
    }

    try {
      let savedSubscription;
      if (doc) {
        savedSubscription = await Subscription.findByIdAndUpdate(doc._id, { $set: update }, { new: true });
      } else if (effectiveOwnerType && effectiveOwnerId) {
        savedSubscription = await Subscription.findOneAndUpdate(
          { ownerType: effectiveOwnerType, ownerId: effectiveOwnerId },
          { $set: update },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } else {
        savedSubscription = doc;
      }

      if (eventId) {
        await this.markWebhookEventAsCompleted({
          eventId,
          stripeSubscriptionId: effectiveStripeSubscription.id,
          ownerType: effectiveOwnerType,
          ownerId: effectiveOwnerId
        });
      }

      return savedSubscription || doc; 
    } catch (error) {
      if (eventId) {
        await this.markWebhookEventAsCompleted({
          eventId,
          stripeSubscriptionId: stripeSubscription.id,
          ownerType: ownerType || doc?.ownerType || null,
          ownerId: ownerId || doc?.ownerId || null,
          errorMessage: error.message
        });
      }
      throw error;
    }
  }

  async reconcileClinicSeatSubscription(clinicaId, options = {}) {
    const activeProfessionalCount = options.activeProfessionalCount ?? await User.countDocuments({
      clinicaId,
      isActive: true,
      role: { $in: PROFESSIONAL_ROLES }
    });
    const extraProfessionals = this.calculateExtraProfessionalSeats(activeProfessionalCount);

    const subscription = await Subscription.findOne({ ownerType: 'clinic', ownerId: clinicaId });
    if (!subscription || !subscription.stripeSubscriptionId) {
      return {
        clinicaId,
        activeProfessionalCount,
        extraProfessionals,
        action: 'skipped',
        reason: 'assinatura sem Stripe confirmada'
      };
    }

    if (!['active', 'trialing'].includes(subscription.status)) {
      return {
        clinicaId,
        activeProfessionalCount,
        extraProfessionals,
        action: 'skipped',
        reason: 'assinatura pendente ou incompleta; cobrança bloqueada até confirmação'
      };
    }

    const stripeClient = this.getStripeClient();
    if (!stripeClient) {
      throw new Error('Configuração de cobrança pendente: STRIPE_SECRET_KEY ausente.');
    }

    const priceId = this.getExtraProfessionalPriceId();
    const stripeSubscription = await stripeClient.subscriptions.retrieve(subscription.stripeSubscriptionId, { expand: ['items.data.price'] });
    const existingItem = (stripeSubscription.items?.data || []).find((item) => item.price && item.price.id === priceId);

    if (extraProfessionals <= 0) {
      if (existingItem) {
        await stripeClient.subscriptionItems.del(existingItem.id);
        return {
          clinicaId,
          activeProfessionalCount,
          extraProfessionals: 0,
          action: 'removed',
          recurringCents: 0,
          priceId
        };
      }

      return {
        clinicaId,
        activeProfessionalCount,
        extraProfessionals: 0,
        action: 'removed',
        recurringCents: 0,
        priceId
      };
    }

    if (!existingItem) {
      await stripeClient.subscriptionItems.create({
        subscription: stripeSubscription.id,
        price: priceId,
        quantity: extraProfessionals,
        metadata: {
          med1peOwnerType: 'clinic',
          med1peOwnerId: String(clinicaId),
          med1pePlan: 'clinic',
          med1peSeatType: 'extra_professional'
        }
      });

      return {
        clinicaId,
        activeProfessionalCount,
        extraProfessionals,
        action: 'created',
        recurringCents: extraProfessionals * EXTRA_PROFESSIONAL_PRICE_CENTS,
        priceId,
        billedAt: subscription.status === 'trialing' ? subscription.trialEndsAt || subscription.currentPeriodEnd || null : subscription.currentPeriodEnd || null
      };
    }

    if (Number(existingItem.quantity) === extraProfessionals) {
      return {
        clinicaId,
        activeProfessionalCount,
        extraProfessionals,
        action: 'unchanged',
        recurringCents: extraProfessionals * EXTRA_PROFESSIONAL_PRICE_CENTS,
        priceId,
        billedAt: subscription.status === 'trialing' ? subscription.trialEndsAt || subscription.currentPeriodEnd || null : subscription.currentPeriodEnd || null
      };
    }

    await stripeClient.subscriptionItems.update(existingItem.id, {
      quantity: extraProfessionals,
      proration_behavior: subscription.status === 'trialing' ? 'none' : 'create_prorations'
    });

    return {
      clinicaId,
      activeProfessionalCount,
      extraProfessionals,
      action: 'updated',
      recurringCents: extraProfessionals * EXTRA_PROFESSIONAL_PRICE_CENTS,
      priceId,
      billedAt: subscription.status === 'trialing' ? subscription.trialEndsAt || subscription.currentPeriodEnd || null : subscription.currentPeriodEnd || null
    };
  }

  async createOrRetrieveCustomer(ownerType, ownerId, user) {
    const stripe = this.getStripeClient();
    if (!stripe) {
      throw new Error('Configuração de cobrança pendente: STRIPE_SECRET_KEY ausente.');
    }

    const existing = await Subscription.findOne({ ownerType, ownerId });
    if (existing && existing.stripeCustomerId) return existing.stripeCustomerId;

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        med1peOwnerType: ownerType,
        med1peOwnerId: String(ownerId)
      }
    });

    await Subscription.findOneAndUpdate(
      { ownerType, ownerId },
      { $set: { stripeCustomerId: customer.id } },
      { upsert: true, new: true }
    );

    return customer.id;
  }

  async createCheckoutSession({ plan, ownerType, ownerId, priceId, customerId, trialEligible = false }) {
    const stripe = this.getStripeClient();
    if (!stripe) {
      throw new Error('Configuração de cobrança pendente: STRIPE_SECRET_KEY ausente.');
    }

    const success_url = `${process.env.FRONTEND_URL}/dashboard?billing=success`;
    const cancel_url = `${process.env.FRONTEND_URL}/dashboard?billing=cancel`;

    const subscriptionData = {
      metadata: {
        med1peOwnerType: ownerType,
        med1peOwnerId: String(ownerId),
        med1pePlan: plan
      }
    };

    if (trialEligible) {
      subscriptionData.trial_period_days = 7;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        med1peOwnerType: ownerType,
        med1peOwnerId: String(ownerId),
        med1pePlan: plan
      },
      subscription_data: subscriptionData,
      success_url,
      cancel_url
    });

    return session;
  }

  async syncSubscriptionFromStripe(stripeSub) {
    return await this.syncStripeSubscription(stripeSub);
  }

  async createBillingPortalSession(customerId) {
    const stripe = this.getStripeClient();
    if (!stripe) {
      throw new Error('Configuração de cobrança pendente: STRIPE_SECRET_KEY ausente.');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`
    });
    return session;
  }
}

module.exports = new BillingService();
