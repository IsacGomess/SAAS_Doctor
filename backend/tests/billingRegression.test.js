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
const clinicController = require('../src/modules/clinics/clinic.controller');
const ClinicService = require('../src/modules/clinics/clinic.service');
const User = require('../src/modules/users/user.model');
const UserService = require('../src/modules/users/user.service');
const { authenticateToken } = require('../src/middlewares/auth');

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

test('uma assinatura Profissional existente bloqueia checkout Clínica antes da reserva', async () => {
  Subscription.findOneAndUpdate = async () => assert.fail('Não deve reservar um checkout Clínica.');
  BillingService.createCheckoutSession = async () => assert.fail('Não deve abrir o Checkout da Stripe.');
  const next = (error) => { throw error; };

  for (const status of ['active', 'trialing', 'past_due', 'unpaid', 'paused']) {
    Subscription.findOne = async (owner) => {
      assert.deepEqual(owner, { ownerType: 'user', ownerId: 'user-1' });
      return { plan: 'professional', status };
    };
    for (const clinicaId of [null, 'clinic-1']) {
      const { req, res } = makeReqRes({ plan: 'clinic' }, 'user-1', clinicaId);
      await billingController.checkout(req, res, next);
      assert.equal(res.statusCode, 409);
      assert.equal(res.payload.code, 'CLINIC_CHECKOUT_BLOCKED');
    }
  }
});

test('checkout Clínica pede cadastro quando a conta ainda não tem clínica', async () => {
  Subscription.findOne = async () => null;
  Subscription.findOneAndUpdate = async () => assert.fail('Não deve reservar um checkout sem clínica.');

  const { req, res } = makeReqRes({ plan: 'clinic' });
  await billingController.checkout(req, res, (error) => { throw error; });

  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.code, 'CLINIC_REQUIRED');
  assert.equal(res.payload.message, 'Crie sua clínica antes de contratar o plano Clínica.');
});

test('a tela de Planos recebe o bloqueio da assinatura pessoal mesmo no contexto da clínica', async () => {
  const clinic = { plan: 'clinic', status: 'canceled' };
  const personal = { plan: 'professional' };
  const next = (error) => { throw error; };

  Subscription.findOne = async ({ ownerType }) => ownerType === 'clinic' ? clinic : personal;
  for (const [status, blocked] of [
    ['trialing', true],
    ['pending', false],
    ['incomplete', false],
    ['canceled', false],
    ['incomplete_expired', false]
  ]) {
    personal.status = status;
    for (const clinicaId of [null, 'clinic-1']) {
      const { req, res } = makeReqRes({}, 'user-1', clinicaId);
      await billingController.getSubscription(req, res, next);
      assert.equal(res.payload.clinicCheckoutBlocked, blocked);
      assert.equal(res.payload.professionalCheckoutBlocked, Boolean(clinicaId));
      assert.equal(res.payload.hasActiveSubscription, status === 'trialing');
      assert.equal(res.payload.subscription.plan, clinicaId ? clinic.plan : personal.plan);
    }
  }
});

test('retorno da Stripe libera o trial da clínica antes do webhook e é idempotente', async () => {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const metadata = {
    med1peOwnerType: 'clinic',
    med1peOwnerId: 'clinic-1',
    med1pePlan: 'clinic',
    med1peCheckoutAttemptId: 'attempt-1'
  };
  let local = {
    _id: 'local-1',
    ownerType: 'clinic',
    ownerId: 'clinic-1',
    plan: 'clinic',
    status: 'pending',
    stripeCustomerId: 'cus_clinic',
    checkoutAttempt: { id: 'attempt-1', plan: 'clinic', priceId: 'price_clinic', expiresAt }
  };
  let lists = 0;
  BillingService._stripeClient = {
    checkout: { sessions: {
      list: async (query) => {
        lists++;
        assert.deepEqual(query, {
          customer: 'cus_clinic',
          status: 'complete',
          created: { gte: Math.floor(expiresAt.getTime() / 1000) - 3600 }
        });
        return { data: [{
          customer: 'cus_clinic', livemode: false, status: 'complete', mode: 'subscription',
          payment_status: 'no_payment_required', subscription: 'sub_clinic', metadata
        }] };
      }
    } },
    subscriptions: {
      retrieve: async (id) => {
        assert.equal(id, 'sub_clinic');
        return {
          id, customer: 'cus_clinic', livemode: false, status: 'trialing', metadata,
          trial_start: 1795340000, trial_end: 1795944800,
          items: { data: [{ price: { id: 'price_clinic' } }] }
        };
      }
    }
  };
  Subscription.findOne = async (query) => {
    if (query.stripeSubscriptionId) return query.stripeSubscriptionId === local.stripeSubscriptionId ? local : null;
    assert.deepEqual(query, { ownerType: 'clinic', ownerId: 'clinic-1' });
    return local;
  };
  Subscription.findOneAndUpdate = async (filter, update) => {
    assert.equal(filter._id, local._id);
    assert.equal(filter.stripeSubscriptionId, null);
    local = { ...local, ...update.$set };
    return local;
  };

  const { req, res } = makeReqRes({ ownerId: 'outra-clinica', sessionId: 'cs_alheia' }, 'user-1', 'clinic-1');
  const next = (error) => { throw error; };
  await billingController.confirmCheckout(req, res, next);
  await billingController.confirmCheckout(req, res, next);

  assert.deepEqual(res.payload, { success: true, hasActiveSubscription: true });
  assert.equal(lists, 1);
  assert.equal(local.status, 'trialing');
  assert.equal(local.stripeSubscriptionId, 'sub_clinic');
  assert.equal(local.trialUsed, true);
  assert.equal(local.trialEndsAt.getTime(), 1795944800000);
  assert.equal(local.checkoutAttempt, null);
  assert.deepEqual(local.processedWebhookEventIds, []);
});

test('retorno mantém pendente se o Checkout ou a assinatura não correspondem à tentativa', async () => {
  const metadata = {
    med1peOwnerType: 'user',
    med1peOwnerId: 'user-1',
    med1pePlan: 'professional',
    med1peCheckoutAttemptId: 'attempt-1'
  };
  const local = {
    ownerType: 'user',
    ownerId: 'user-1',
    status: 'pending',
    stripeCustomerId: 'cus_owner',
    checkoutAttempt: { id: 'attempt-1', plan: 'professional', priceId: 'price_professional', expiresAt: new Date() }
  };
  const session = {
    customer: 'cus_owner', livemode: false, status: 'complete', mode: 'subscription',
    payment_status: 'paid', subscription: 'sub_1', metadata
  };
  const subscription = {
    id: 'sub_1', customer: 'cus_owner', livemode: false, status: 'active', metadata,
    items: { data: [{ price: { id: 'price_professional' } }] }
  };
  BillingService.syncStripeSubscription = async () => assert.fail('Não deve sincronizar uma tentativa não comprovada.');
  for (const [sessionChanges, subscriptionChanges] of [
    [{ status: 'open' }, {}],
    [{ payment_status: 'unpaid' }, {}],
    [{ customer: 'cus_else' }, {}],
    [{ livemode: true }, {}],
    [{ metadata: { ...metadata, med1peCheckoutAttemptId: 'attempt-old' } }, {}],
    [{}, { status: 'incomplete' }],
    [{}, { metadata: { ...metadata, med1peOwnerId: 'other-user' } }],
    [{}, { items: { data: [{ price: { id: 'price_clinic' } }] } }]
  ]) {
    BillingService._stripeClient = {
      checkout: { sessions: { list: async () => ({ data: [{ ...session, ...sessionChanges }] }) } },
      subscriptions: { retrieve: async () => ({ ...subscription, ...subscriptionChanges }) }
    };
    assert.equal(await BillingService.reconcileCompletedCheckout(local), local);
  }
});

test('cadastro da clínica mantém a sessão e bloqueia o checkout Profissional', async (t) => {
  const user = {
    _id: 'user-1',
    name: 'Profissional',
    clinicaId: 'clinic-1',
    role: 'administrador',
    isActive: true,
    tokenVersion: 2
  };
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'clinic-session-test-fixture';
  t.after(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  t.mock.method(ClinicService, 'create', async () => ({ _id: user.clinicaId }));
  t.mock.method(UserService, 'associateClinicAndMakeAdmin', async () => user);
  User.findById = () => ({ select: async () => user });
  Subscription.findOne = async () => null;
  Subscription.findOneAndUpdate = async () => assert.fail('Não deve reservar um checkout Profissional.');
  const next = (error) => { if (error) throw error; };

  const registration = makeReqRes({ name: 'Clínica de Teste' });
  let accessToken;
  registration.res.cookie = (name, value) => {
    assert.equal(name, 'accessToken');
    accessToken = value;
  };
  await clinicController.createClinica(registration.req, registration.res);
  assert.equal(registration.res.statusCode, 201);
  assert.ok(accessToken);

  const billing = makeReqRes({});
  billing.req.cookies = { accessToken };
  await authenticateToken(billing.req, billing.res, next);
  assert.equal(billing.res.statusCode, 200);
  assert.equal(billing.req.clinicaId, user.clinicaId);
  await billingController.getSubscription(billing.req, billing.res, next);
  assert.equal(billing.res.payload.subscription, null);
  assert.equal(billing.res.payload.professionalCheckoutBlocked, true);
  assert.equal(billing.res.payload.hasActiveSubscription, false);

  const checkout = makeReqRes({ plan: 'professional' }, user._id, user.clinicaId);
  await billingController.checkout(checkout.req, checkout.res, next);
  assert.equal(checkout.res.statusCode, 409);
  assert.equal(checkout.res.payload.code, 'PROFESSIONAL_CHECKOUT_BLOCKED');
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
