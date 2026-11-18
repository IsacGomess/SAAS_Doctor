const test = require('node:test');
const assert = require('node:assert/strict');
const Stripe = require('stripe');

process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'test_key';
process.env.STRIPE_PRICE_PROFESSIONAL = process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional';
process.env.STRIPE_PRICE_CLINIC = process.env.STRIPE_PRICE_CLINIC || 'price_clinic';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const billingController = require('../src/modules/billing/billing.controller');
const BillingService = require('../src/modules/billing/billing.service');
const Subscription = require('../src/modules/billing/subscription.model');
const User = require('../src/modules/users/user.model');

const originalFindOne = Subscription.findOne;
const originalFindOneAndUpdate = Subscription.findOneAndUpdate;
const originalUserFindById = User.findById;
const originalCreateOrRetrieveCustomer = BillingService.createOrRetrieveCustomer;
const originalCreateCheckoutSession = BillingService.createCheckoutSession;
const originalFindBlockingStripeSubscription = BillingService.findBlockingStripeSubscription;
const originalFindOpenCheckoutSession = BillingService.findOpenCheckoutSession;
const originalStripeClient = BillingService._stripeClient;
const originalSyncStripeSubscription = BillingService.syncStripeSubscription;

function makeReqRes(body, userId = 'user-1', clinicaId = null, role = 'administrador') {
  const req = { body, userId, clinicaId, user: { role } };
  let statusCode = 200;
  let payload = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get payload() {
      return payload;
    }
  };

  return { req, res };
}

function restoreOriginals() {
  Subscription.findOne = originalFindOne;
  Subscription.findOneAndUpdate = originalFindOneAndUpdate;
  User.findById = originalUserFindById;
  BillingService.createOrRetrieveCustomer = originalCreateOrRetrieveCustomer;
  BillingService.createCheckoutSession = originalCreateCheckoutSession;
  BillingService.findBlockingStripeSubscription = originalFindBlockingStripeSubscription;
  BillingService.findOpenCheckoutSession = originalFindOpenCheckoutSession;
  BillingService._stripeClient = originalStripeClient;
  BillingService.syncStripeSubscription = originalSyncStripeSubscription;
}

test.beforeEach(() => {
  BillingService.findBlockingStripeSubscription = async () => null;
  BillingService.findOpenCheckoutSession = async () => null;
});

test.afterEach(restoreOriginals);

test('conta nova: trialEligible true e checkout recebe trial de 7 dias', async () => {
  const fakeStripe = {
    checkout: {
      sessions: {
        create: async (payload) => {
          assert.equal(payload.subscription_data.trial_period_days, 7);
          return { url: 'https://trial.checkout' };
        }
      }
    }
  };

  BillingService._stripeClient = fakeStripe;
  Subscription.findOne = async ({ ownerType, ownerId }) => {
    if (ownerType === 'user' && ownerId === 'user-1') return null;
    return null;
  };
  Subscription.findOneAndUpdate = async (_filter, update) => ({
    checkoutAttempt: update.$set.checkoutAttempt,
    ownerType: 'user',
    ownerId: 'user-1',
    plan: 'professional',
    status: 'pending',
    trialUsed: false,
    stripeCustomerId: 'cus_new'
  });
  User.findById = async () => ({ _id: 'user-1', email: 'a@a.com', name: 'User' });
  BillingService.createOrRetrieveCustomer = async () => 'cus_new';

  const { req, res } = makeReqRes({ plan: 'professional' }, 'user-1', null, 'administrador');
  await billingController.checkout(req, res, (err) => { if (err) throw err; });

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);
  assert.equal(res.payload.url, 'https://trial.checkout');
  restoreOriginals();
});

test('assinatura canceled com stripeSubscriptionId antigo não recebe trial', async () => {
  let checkoutArgs = null;

  Subscription.findOne = async (query) => {
    if (query && query.ownerType === 'user' && query.ownerId === 'user-1') {
      return {
        ownerType: 'user',
        ownerId: 'user-1',
        plan: 'professional',
        status: 'canceled',
        trialUsed: false,
        stripeSubscriptionId: 'sub_old'
      };
    }
    return null;
  };

  Subscription.findOneAndUpdate = async (_filter, update) => ({
    checkoutAttempt: update.$set.checkoutAttempt,
    ownerType: 'user',
    ownerId: 'user-1',
    plan: 'professional',
    status: 'pending',
    trialUsed: false,
    stripeSubscriptionId: 'sub_old',
    stripeCustomerId: 'cus_old'
  });
  User.findById = async () => ({ _id: 'user-1', email: 'a@a.com', name: 'User' });
  BillingService.createOrRetrieveCustomer = async () => 'cus_old';
  BillingService.createCheckoutSession = async (args) => {
    checkoutArgs = args;
    return { url: 'https://stripe.checkout/session' };
  };

  const { req, res } = makeReqRes({ plan: 'professional' }, 'user-1', null, 'administrador');
  await billingController.checkout(req, res, (err) => { if (err) throw err; });

  assert.equal(res.statusCode, 200);
  assert.equal(checkoutArgs.trialEligible, false);
  assert.equal(checkoutArgs.plan, 'professional');
  restoreOriginals();
});

test('assina canceled com trialUsed true também não recebe trial', async () => {
  let checkoutArgs = null;

  Subscription.findOne = async (query) => {
    if (query && query.ownerType === 'user' && query.ownerId === 'user-1') {
      return {
        ownerType: 'user',
        ownerId: 'user-1',
        plan: 'professional',
        status: 'canceled',
        trialUsed: true,
        stripeSubscriptionId: 'sub_old_2'
      };
    }
    return null;
  };

  Subscription.findOneAndUpdate = async (_filter, update) => ({
    checkoutAttempt: update.$set.checkoutAttempt,
    ownerType: 'user',
    ownerId: 'user-1',
    plan: 'professional',
    status: 'pending',
    trialUsed: true,
    stripeCustomerId: 'cus_trial_used'
  });
  User.findById = async () => ({ _id: 'user-1', email: 'a@a.com', name: 'User' });
  BillingService.createOrRetrieveCustomer = async () => 'cus_trial_used';
  BillingService.createCheckoutSession = async (args) => {
    checkoutArgs = args;
    return { url: 'https://stripe.checkout/session' };
  };

  const { req, res } = makeReqRes({ plan: 'professional' }, 'user-1', null, 'administrador');
  await billingController.checkout(req, res, (err) => { if (err) throw err; });

  assert.equal(checkoutArgs.trialEligible, false);
  assert.equal(res.statusCode, 200);
  restoreOriginals();
});

test('reserva de checkout guarda o plano da tentativa e preserva a assinatura anterior', async () => {
  let reservationCall = null;

  Subscription.findOne = async (query) => {
    if (query && query.ownerType === 'clinic' && query.ownerId === 'clinic-1') {
      return {
        ownerType: 'clinic',
        ownerId: 'clinic-1',
        plan: 'clinic',
        status: 'canceled',
        trialUsed: true,
        trialStartedAt: new Date('2026-10-01T00:00:00.000Z'),
        trialEndsAt: new Date('2026-10-08T00:00:00.000Z'),
        stripeCustomerId: 'cus_preserve',
        stripeSubscriptionId: 'sub_old_clinic'
      };
    }
    return null;
  };

  Subscription.findOneAndUpdate = async (filter, update, options) => {
    reservationCall = { filter, update, options };
    return {
      ownerType: 'clinic',
      ownerId: 'clinic-1',
      checkoutAttempt: update.$set.checkoutAttempt,
      plan: 'clinic',
      status: 'canceled',
      trialUsed: true,
      trialStartedAt: new Date('2026-10-01T00:00:00.000Z'),
      trialEndsAt: new Date('2026-10-08T00:00:00.000Z'),
      stripeCustomerId: 'cus_preserve',
      stripeSubscriptionId: 'sub_old_clinic'
    };
  };
  User.findById = async () => ({ _id: 'user-1', email: 'a@a.com', name: 'User' });
  BillingService.createOrRetrieveCustomer = async () => 'cus_preserve';
  BillingService.createCheckoutSession = async () => ({ url: 'https://stripe.checkout/session' });

  const { req, res } = makeReqRes({ plan: 'clinic' }, 'user-1', 'clinic-1', 'administrador');
  await billingController.checkout(req, res, (err) => { if (err) throw err; });

  assert.equal(res.statusCode, 200);
  assert.equal(reservationCall.update.$set.checkoutAttempt.plan, 'clinic');
  assert.equal(reservationCall.update.$set.checkoutAttempt.trialEligible, false);
  assert.deepEqual(Object.keys(reservationCall.update.$set), ['checkoutAttempt']);
  assert.deepEqual(reservationCall.filter.status.$in, ['pending', 'canceled', 'incomplete_expired']);
  assert.equal(reservationCall.options.upsert, false);
  restoreOriginals();
});

test('duas requisições simultâneas para mesmo owner: uma reserva e a outra recebe 409', async () => {
  const store = new Map();
  let createSessionCalls = 0;

  Subscription.findOne = async (query) => {
    const key = `${query.ownerType}:${query.ownerId}`;
    return store.get(key) || null;
  };

  Subscription.findOneAndUpdate = async (filter, update, options) => {
    const key = `${filter.ownerType}:${filter.ownerId}`;
    if (!store.has(key)) {
      const doc = {
        ownerType: filter.ownerType,
        ownerId: filter.ownerId,
        plan: update.$setOnInsert.plan,
        checkoutAttempt: update.$set.checkoutAttempt,
        status: 'pending',
        trialUsed: false,
        stripeCustomerId: 'cus_locked'
      };
      store.set(key, doc);
      return doc;
    }

    const err = new Error('duplicate');
    err.code = 11000;
    throw err;
  };

  User.findById = async () => ({ _id: 'user-1', email: 'a@a.com', name: 'User' });
  BillingService.createOrRetrieveCustomer = async () => 'cus_locked';
  BillingService.createCheckoutSession = async () => {
    createSessionCalls += 1;
    return { url: 'https://stripe.checkout/session' };
  };

  const first = makeReqRes({ plan: 'professional' }, 'user-1', null, 'administrador');
  const second = makeReqRes({ plan: 'professional' }, 'user-1', null, 'administrador');

  const next = (err) => { if (err) throw err; };
  await Promise.all([
    billingController.checkout(first.req, first.res, next),
    billingController.checkout(second.req, second.res, next)
  ]);

  assert.equal(first.res.statusCode, 200);
  assert.equal(second.res.statusCode, 409);
  assert.equal(createSessionCalls, 1);
  restoreOriginals();
});

test('assinaturas vigentes ou recuperáveis bloqueiam um novo checkout', async () => {
  const blockingStatuses = ['active', 'trialing', 'incomplete', 'past_due', 'unpaid', 'paused'];

  for (const status of blockingStatuses) {
    Subscription.findOne = async (query) => {
      if (query && query.ownerType === 'user' && query.ownerId === 'user-2') {
        return { ownerType: 'user', ownerId: 'user-2', status, trialUsed: false, stripeSubscriptionId: 'sub_'+status };
      }
      return null;
    };

    Subscription.findOneAndUpdate = async () => {
      assert.fail('Uma assinatura vigente não pode reservar outro checkout.');
    };

    User.findById = async () => ({ _id: 'user-2', email: 'u2@test.com', name: 'User 2' });

    const { req, res } = makeReqRes({ plan: 'professional' }, 'user-2', null, 'administrador');
    await billingController.checkout(req, res, (err) => { if (err) throw err; });
    assert.equal(res.statusCode, 409, `${status} should block checkout`);
    assert.equal(res.payload.code, 'SUBSCRIPTION_ALREADY_ACTIVE');
  }

  restoreOriginals();
});

test('webhook passa eventId e eventCreatedAt para syncStripeSubscription', async () => {
  let seenOptions = null;
  BillingService.syncStripeSubscription = async (_sub, options) => {
    seenOptions = options;
    return { ok: true };
  };

  const event = {
    id: 'evt_123',
    livemode: false,
    created: 1700000000,
    type: 'customer.subscription.updated',
    data: { object: { id: 'sub_123', status: 'active', customer: 'cus_123', metadata: {}, items: { data: [{ price: { id: 'price_professional' } }] } } }
  };

  const stripeMock = {
    webhooks: { constructEvent: () => event },
    subscriptions: { retrieve: async () => event.data.object }
  };

  const original = require.cache[require.resolve('stripe')];
  require.cache[require.resolve('stripe')] = { exports: () => stripeMock };

  try {
    await billingController.webhook({
      headers: { 'stripe-signature': 'sig' },
      body: Buffer.from('raw-event')
    }, {
      status(code) { return { json: () => code, send: () => code }; },
      json: () => ({ received: true })
    });
  } finally {
    if (original) {
      require.cache[require.resolve('stripe')] = original;
    } else {
      delete require.cache[require.resolve('stripe')];
    }
  }

  assert.equal(seenOptions.eventId, 'evt_123');
  assert.equal(seenOptions.eventCreatedAt instanceof Date, true);
  assert.equal(seenOptions.eventCreatedAt.getTime(), new Date(1700000000 * 1000).getTime());

  restoreOriginals();
});

test('getCurrentStripeSubscriptionState falha fechado ao receber erro de retrieve', async () => {
  const billingService = BillingService;
  billingService._stripeClient = {
    subscriptions: {
      retrieve: async () => {
        throw new Error('stripe unavailable');
      }
    }
  };

  await assert.rejects(
    () => billingService.getCurrentStripeSubscriptionState({ id: 'sub_fail' }),
    /stripe unavailable/
  );

  restoreOriginals();
});

test('webhook de fatura assinada sincroniza a assinatura nos formatos atual e legado', async (t) => {
  const stripe = Stripe('test_key');
  const secret = 'local_invoice_signing_fixture';
  const retrieved = [];
  const synced = [];
  const stripeModule = require.cache[require.resolve('stripe')];
  const original = stripeModule.exports;
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  stripeModule.exports = () => ({
    webhooks: stripe.webhooks,
    subscriptions: { retrieve: async (id) => {
      retrieved.push(id);
      return { id };
    } }
  });
  BillingService.syncStripeSubscription = async (subscription) => {
    synced.push(subscription.id);
  };
  t.after(() => {
    stripeModule.exports = original;
  });

  for (const [type, invoice] of [
    ['invoice.paid', { parent: { type: 'subscription_details', subscription_details: { subscription: 'sub_modern' } } }],
    ['invoice.payment_failed', { parent: { type: 'subscription_details', subscription_details: { subscription: { id: 'sub_failed' } } } }],
    ['invoice.paid', { subscription: 'sub_legacy' }],
    ['invoice.paid', { parent: null }]
  ]) {
    const payload = JSON.stringify({
      id: 'evt_local_invoice',
      livemode: false,
      created: Math.floor(Date.now() / 1000),
      type,
      data: { object: invoice }
    });
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
    const { res } = makeReqRes({});
    await billingController.webhook({
      headers: { 'stripe-signature': signature },
      body: Buffer.from(payload)
    }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload, { received: true });
  }

  assert.deepEqual(retrieved, ['sub_modern', 'sub_failed', 'sub_legacy']);
  assert.deepEqual(synced, retrieved);
});

test('webhook com assinatura válida rejeita evento de outro modo antes de sincronizar', async () => {
  const stripe = Stripe('test_key');
  const secret = 'local_mode_signing_fixture';
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  BillingService.syncStripeSubscription = async () => assert.fail('Não deve sincronizar');

  const payload = JSON.stringify({
    id: 'evt_wrong_mode',
    livemode: true,
    created: Math.floor(Date.now() / 1000),
    type: 'customer.subscription.updated',
    data: { object: { id: 'sub_fixture' } }
  });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
  let status;
  let message;
  await billingController.webhook({
    headers: { 'stripe-signature': signature },
    body: Buffer.from(payload)
  }, {
    status(code) {
      status = code;
      return this;
    },
    send(body) { message = body; }
  });

  assert.equal(status, 400);
  assert.match(message, /modo do evento/);
});
