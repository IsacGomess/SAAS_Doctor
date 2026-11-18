const { ZodError, z } = require('zod');
const BillingService = require('./billing.service');
const { stripeLiveMode } = require('./stripe-mode');
const User = require('../users/user.model');

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

    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });

    const reservation = await BillingService.reserveCheckout({ ownerType, ownerId, plan, priceId });
    if (!reservation) {
      return res.status(409).json({
        success: false,
        code: 'SUBSCRIPTION_ALREADY_ACTIVE',
        message: 'Já existe uma assinatura para esta conta ou outra tentativa em andamento. Use o gerenciamento da assinatura para resolver pagamentos pendentes.'
      });
    }

    const attempt = reservation.checkoutAttempt;
    const customerId = await BillingService.createOrRetrieveCustomer(ownerType, ownerId, user, attempt.id);

    // Stripe can already have the subscription even if the app has yet to receive its webhook.
    if (reservation.stripeCustomerId) {
      const openSession = await BillingService.findOpenCheckoutSession(customerId);
      const blockingSubscription = await BillingService.findBlockingStripeSubscription(customerId);
      if (blockingSubscription) {
        await BillingService.syncStripeSubscription(blockingSubscription);
        return res.status(409).json({
          success: false,
          code: 'SUBSCRIPTION_ALREADY_ACTIVE',
          message: 'Já existe uma assinatura na Stripe. Use o gerenciamento da assinatura para resolver pagamentos pendentes.'
        });
      }

      if (openSession?.metadata?.med1pePlan === plan && openSession.url) {
        return res.status(200).json({ success: true, url: openSession.url });
      }
      if (openSession) {
        return res.status(409).json({
          success: false,
          code: 'CHECKOUT_ALREADY_OPEN',
          message: 'Já existe um checkout aberto. Conclua a tentativa anterior ou aguarde a sessão expirar.'
        });
      }
    }

    const session = await BillingService.createCheckoutSession({
      plan: attempt.plan,
      ownerType,
      ownerId,
      priceId: attempt.priceId,
      customerId,
      trialEligible: attempt.trialEligible,
      attemptId: attempt.id,
      expiresAt: attempt.expiresAt
    });

    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Dados inválidos.', errors: error.flatten().fieldErrors });
    }
    if (error.code === 'idempotency_key_in_use') {
      return res.status(409).json({
        success: false,
        code: 'CHECKOUT_ALREADY_OPEN',
        message: 'O checkout está sendo preparado. Tente novamente em instantes.'
      });
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

    const trialEligible = BillingService.isTrialEligible(sub);

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

  if (event.livemode !== stripeLiveMode) {
    return res.status(400).send('O modo do evento da Stripe não corresponde ao modo deste servidor.');
  }

  try {
    const type = event.type;
    const obj = event.data.object;
    const syncOptions = {
      eventId: event.id,
      eventCreatedAt: new Date(event.created * 1000)
    };

    if (type === 'checkout.session.expired') {
      await BillingService.releaseExpiredCheckout(obj);
    }

    if (type === 'checkout.session.completed') {
      const session = obj;
      if (session.subscription) {
        const stripeSubscription = await stripeLib.subscriptions.retrieve(session.subscription, { expand: ['items.data.price'] });
        await BillingService.syncStripeSubscription(stripeSubscription, syncOptions);
      }
    }

    if (
      type === 'customer.subscription.created' ||
      type === 'customer.subscription.updated' ||
      type === 'customer.subscription.deleted'
    ) {
      const stripeSubscription = obj;
      await BillingService.syncStripeSubscription(stripeSubscription, syncOptions);
    }

    if (
      type === 'invoice.paid' ||
      type === 'invoice.payment_succeeded' ||
      type === 'invoice.payment_failed'
    ) {
      const subscription = obj.parent?.subscription_details?.subscription ?? obj.subscription;
      const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id;
      if (subscriptionId) {
        const stripeSubscription = await stripeLib.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] });
        await BillingService.syncStripeSubscription(stripeSubscription, syncOptions);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return res.status(500).send('Server error');
  }
};
