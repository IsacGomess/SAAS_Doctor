const { ZodError, z } = require('zod');
const BillingService = require('./billing.service');
const User = require('../users/user.model');
const Subscription = require('./subscription.model');
const { ACTIVE_SUBSCRIPTION_STATUSES } = require('../../middlewares/requireActiveSubscription');

const checkoutSchema = z.object({
  plan: z.enum(['professional', 'clinic'])
});

exports.checkout = async (req, res, next) => {
  try {
    const { plan } = checkoutSchema.parse(req.body);

    // determine owner
    let ownerType, ownerId;
    if (plan === 'professional') {
      ownerType = 'user';
      ownerId = req.userId;
    } else {
      // clinic plan
      if (!req.clinicaId) {
        return res.status(400).json({ success: false, message: 'Crie sua clínica antes de contratar o plano Clínica.' });
      }
      if (!req.user || req.user.role !== 'administrador') {
        return res.status(403).json({ success: false, message: 'Apenas administrador pode contratar plano da clínica.' });
      }
      ownerType = 'clinic';
      ownerId = req.clinicaId;
    }

    // choose price server-side
    const PLAN_PRICES = () => ({
      professional: process.env.STRIPE_PRICE_PROFESSIONAL,
      clinic: process.env.STRIPE_PRICE_CLINIC
    });

    const priceId = PLAN_PRICES()[plan];
    if (!priceId) {
      return res.status(500).json({ success: false, message: 'Plano não configurado no servidor' });
    }

    const existingSubscription = await Subscription.findOne({ ownerType, ownerId });
    const trialEligible = !Boolean(existingSubscription?.trialUsed) && !['active', 'trialing', 'pending', 'incomplete'].includes(existingSubscription?.status || '');

    // Block new checkout when there's an existing subscription that represents an active/in-flight subscription.
    // Add statuses that should block new checkout attempts to prevent duplicates during concurrent requests.
    const BLOCKING_STATUSES = ['active', 'trialing', 'pending', 'incomplete'];

    const existingBlocking = await Subscription.findOne({
      ownerType,
      ownerId,
      status: { $in: BLOCKING_STATUSES }
    });

    if (existingBlocking) {
      return res.status(409).json({
        success: false,
        code: 'SUBSCRIPTION_ALREADY_ACTIVE',
        message: 'Já existe uma assinatura para esta conta.'
      });
    }

    // ensure user exists
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });

    // ensure or create stripe customer
    const customerId = await BillingService.createOrRetrieveCustomer(ownerType, ownerId, user);

    // persist subscription record as pending (reserve) in an idempotent way to avoid concurrent checkouts creating duplicates
    let reservation;
    try {
      reservation = await Subscription.findOneAndUpdate(
        { ownerType, ownerId },
        { $setOnInsert: { ownerType, ownerId, plan, status: 'pending', stripeCustomerId: customerId } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      // handle potential duplicate key race: read existing doc and decide
      if (err && err.code === 11000) {
        reservation = await Subscription.findOne({ ownerType, ownerId });
      } else {
        throw err;
      }
    }

    // If reservation was not created by us due to a duplicate key race,
    // fetch the existing document and block if it has a blocking status.
    if (!reservation) {
      const existing = await Subscription.findOne({ ownerType, ownerId });
      if (existing && ['active', 'trialing', 'pending', 'incomplete'].includes(existing.status)) {
        return res.status(409).json({
          success: false,
          code: 'SUBSCRIPTION_ALREADY_ACTIVE',
          message: 'Já existe uma assinatura para esta conta.'
        });
      }
    }

    const session = await BillingService.createCheckoutSession({
      plan,
      ownerType,
      ownerId,
      priceId,
      customerId,
      trialEligible
    });

    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Dados inválidos.', errors: error.flatten().fieldErrors });
    }
    return next(error);
  }
};

exports.getSubscription = async (req, res, next) => {
  try {
    // determine owner context: prefer clinic context when available
    let ownerType = req.clinicaId ? 'clinic' : 'user';
    let ownerId = req.clinicaId || req.userId;

    const sub = await BillingService.getSubscriptionByOwner(ownerType, ownerId);
    if (!sub) {
      return res.status(200).json({
        success: true,
        subscription: null,
        trialEligible: true
      });
    }

    const trialEligible = !Boolean(sub.trialUsed) && !['active', 'trialing', 'pending', 'incomplete'].includes(sub.status || '');

    return res.status(200).json({ success: true, subscription: {
      plan: sub.plan,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAt: sub.cancelAt,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      trialUsed: sub.trialUsed,
      trialStartedAt: sub.trialStartedAt,
      trialEndsAt: sub.trialEndsAt
    }, trialEligible });
  } catch (error) {
    return next(error);
  }
};

exports.portal = async (req, res, next) => {
  try {
    // owner selection as above
    let ownerType = req.clinicaId ? 'clinic' : 'user';
    let ownerId = req.clinicaId || req.userId;

    const sub = await BillingService.getSubscriptionByOwner(ownerType, ownerId);
    if (!sub || !sub.stripeCustomerId) {
      return res.status(400).json({ success: false, message: 'Nenhum cliente de cobrança encontrado.' });
    }

    if (ownerType === 'clinic' && (!req.user || req.user.role !== 'administrador')) {
      return res.status(403).json({ success: false, message: 'Apenas administrador pode gerenciar a assinatura da clínica.' });
    }

    const session = await BillingService.createBillingPortalSession(sub.stripeCustomerId);
    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    return next(error);
  }
};

// Webhook handler - expects raw body
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const stripeLib = require('stripe')(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = stripeLib.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  
  try {
    const type = event.type;
    const obj = event.data.object;

    // handle main events
    if (type === 'checkout.session.completed') {
      const session = obj;
      if (session.subscription) {
        const stripeSubscription = await stripeLib.subscriptions.retrieve(session.subscription, { expand: ['items.data.price'] });
        await BillingService.syncStripeSubscription(stripeSubscription, { eventId: event.id });
      }
    }

    if (
      type === 'customer.subscription.created' ||
      type === 'customer.subscription.updated' ||
      type === 'customer.subscription.deleted'
    ) {
      const stripeSubscription = obj;
      await BillingService.syncStripeSubscription(stripeSubscription, { eventId: event.id });
    }

    if (
      type === 'invoice.paid' ||
      type === 'invoice.payment_succeeded' ||
      type === 'invoice.payment_failed'
    ) {
      const invoice = obj;
      if (invoice.subscription) {
        const stripeSubscription = await stripeLib.subscriptions.retrieve(invoice.subscription, { expand: ['items.data.price'] });
        await BillingService.syncStripeSubscription(stripeSubscription, { eventId: event.id });
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return res.status(500).send('Server error');
  }
};
