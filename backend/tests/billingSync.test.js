const test = require('node:test');
const assert = require('node:assert/strict');

process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'test_key';
process.env.STRIPE_PRICE_PROFESSIONAL = process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional';
process.env.STRIPE_PRICE_CLINIC = process.env.STRIPE_PRICE_CLINIC || 'price_clinic';

const Subscription = require('../src/modules/billing/subscription.model');
const BillingService = require('../src/modules/billing/billing.service');

const originalFindOne = Subscription.findOne;
const originalFindOneAndUpdate = Subscription.findOneAndUpdate;
const originalGetCurrentStripeSubscriptionState = BillingService.getCurrentStripeSubscriptionState;

test('dois eventos simultâneos da mesma assinatura são processados sem perder o segundo', async (t) => {
  const stripeSubscription = {
    id: 'sub_race',
    status: 'trialing',
    metadata: { med1peOwnerType: 'user', med1peOwnerId: 'user-race', med1pePlan: 'professional' }
  };
  let doc = {
    _id: 'doc-race',
    ownerType: 'user',
    ownerId: 'user-race',
    plan: 'professional',
    status: 'pending',
    stripeSubscriptionId: null,
    updatedAt: new Date(1000)
  };

  const completed = [];
  let conflictingWrites = 0;
  let stripeReads = 0;
  let resolveInitialReads;
  const initialReads = new Promise((resolve) => { resolveInitialReads = resolve; });

  t.mock.method(Subscription, 'findOne', async (query) => {
    if (query.stripeSubscriptionId && query.stripeSubscriptionId !== doc.stripeSubscriptionId) return null;
    return { ...doc };
  });
  t.mock.method(BillingService, 'getCurrentStripeSubscriptionState', async (subscription) => {
    if (++stripeReads === 2) resolveInitialReads();
    await initialReads;
    return subscription;
  });
  t.mock.method(BillingService, 'reserveWebhookEventForProcessing', async () => ({ shouldProcess: true }));
  t.mock.method(BillingService, 'markWebhookEventAsCompleted', async (event) => { completed.push(event); });
  t.mock.method(Subscription, 'findOneAndUpdate', async (filter, update) => {
    if (filter.stripeSubscriptionId !== doc.stripeSubscriptionId || filter.updatedAt.getTime() !== doc.updatedAt.getTime()) {
      conflictingWrites++;
      return null;
    }
    doc = { ...doc, ...update.$set, updatedAt: new Date(doc.updatedAt.getTime() + 1) };
    return { ...doc };
  });

  const results = await Promise.all([
    BillingService.syncStripeSubscription(stripeSubscription, { eventId: 'evt_new_subscription', eventCreatedAt: new Date(2000) }),
    BillingService.syncStripeSubscription(stripeSubscription, { eventId: 'evt_trial_invoice', eventCreatedAt: new Date(2001) })
  ]);

  assert.equal(conflictingWrites, 1);
  assert.equal(stripeReads, 3);
  assert.ok(results.every((result) => result.status === 'trialing'));
  assert.deepEqual(new Set(doc.processedWebhookEventIds), new Set(['evt_new_subscription', 'evt_trial_invoice']));
  assert.equal(doc.lastWebhookEventId, 'evt_trial_invoice');
  assert.equal(completed.length, 2);
  assert.ok(completed.every((event) => !event.errorMessage));
});

test('evento de assinatura antiga não substitui a assinatura mais recente', async (t) => {
  const current = {
    _id: 'doc-current',
    ownerType: 'user',
    ownerId: 'user-current',
    stripeSubscriptionId: 'sub_current',
    status: 'active'
  };
  const older = {
    id: 'sub_previous',
    status: 'canceled',
    created: 1700000000,
    metadata: { med1peOwnerType: current.ownerType, med1peOwnerId: current.ownerId }
  };
  Subscription.findOne = async ({ stripeSubscriptionId }) => stripeSubscriptionId ? null : current;
  Subscription.findOneAndUpdate = async () => assert.fail('Uma assinatura antiga não pode substituir a atual.');
  BillingService.getCurrentStripeSubscriptionState = async (subscription) => {
    if (subscription.id === current.stripeSubscriptionId) {
      return { id: current.stripeSubscriptionId, created: 1720000000, status: 'canceled' };
    }
    return subscription;
  };
  t.after(() => {
    Subscription.findOne = originalFindOne;
    Subscription.findOneAndUpdate = originalFindOneAndUpdate;
    BillingService.getCurrentStripeSubscriptionState = originalGetCurrentStripeSubscriptionState;
  });

  assert.equal(await BillingService.syncStripeSubscription(older, { eventId: 'evt_old' }), current);
  current.status = 'canceled';
  assert.equal(await BillingService.syncStripeSubscription(older, { eventId: 'evt_old' }), current);
});

test('reativação troca a assinatura encerrada pela assinatura do checkout reservado', async (t) => {
  const current = {
    _id: 'doc-renew',
    ownerType: 'user',
    ownerId: 'user-renew',
    stripeSubscriptionId: 'sub_canceled',
    status: 'canceled',
    plan: 'professional',
    checkoutAttempt: { id: 'attempt-new' },
    updatedAt: new Date()
  };
  const next = {
    id: 'sub_reactivated',
    status: 'active',
    metadata: {
      med1peOwnerType: current.ownerType,
      med1peOwnerId: current.ownerId,
      med1peCheckoutAttemptId: 'attempt-new'
    }
  };
  Subscription.findOne = async ({ stripeSubscriptionId }) => stripeSubscriptionId ? null : current;
  Subscription.findOneAndUpdate = async (filter, update) => {
    assert.deepEqual(filter, { _id: current._id, stripeSubscriptionId: 'sub_canceled', updatedAt: current.updatedAt });
    assert.equal(update.$set.checkoutAttempt, null);
    return { ...current, ...update.$set };
  };
  BillingService.getCurrentStripeSubscriptionState = async (subscription) => (
    subscription.id === 'sub_canceled' ? { id: 'sub_canceled', status: 'canceled' } : subscription
  );
  t.after(() => {
    Subscription.findOne = originalFindOne;
    Subscription.findOneAndUpdate = originalFindOneAndUpdate;
    BillingService.getCurrentStripeSubscriptionState = originalGetCurrentStripeSubscriptionState;
  });

  const updated = await BillingService.syncStripeSubscription(next);
  assert.equal(updated.status, 'active');
  assert.equal(updated.stripeSubscriptionId, 'sub_reactivated');
});

test('syncStripeSubscription overwrites stale pending status with real stripe subscription status', async () => {
  const existingDoc = {
    _id: 'doc-1',
    ownerType: 'clinic',
    ownerId: 'clinic-abc',
    plan: 'clinic',
    status: 'pending',
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_old',
    stripePriceId: 'old_price',
    currentPeriodEnd: new Date('2024-01-01T00:00:00.000Z'),
    cancelAtPeriodEnd: false
  };

  Subscription.findOne = async (query) => {
    if (query && query.ownerType === 'clinic' && query.ownerId === 'clinic-abc') {
      return existingDoc;
    }

    return null;
  };

  Subscription.findOneAndUpdate = async ({ _id }, update) => {
    assert.equal(_id, 'doc-1');
    assert.equal(update.$set.status, 'active');
    assert.equal(update.$set.plan, 'clinic');
    assert.equal(update.$set.ownerType, 'clinic');
    assert.equal(update.$set.ownerId, 'clinic-abc');
    return { ...existingDoc, ...update.$set };
  };

  const stripeSubscription = {
    id: 'sub_active',
    created: 1767225600,
    status: 'active',
    customer: 'cus_456',
    metadata: { med1peOwnerType: 'clinic', med1peOwnerId: 'clinic-abc', med1pePlan: 'clinic' },
    current_period_end: 1767225600,
    cancel_at_period_end: false,
    items: {
      data: [{ price: { id: 'price_clinic' } }]
    }
  };

  BillingService.getCurrentStripeSubscriptionState = async (subscription) => (
    subscription.id === 'sub_old'
      ? { id: 'sub_old', status: 'canceled', created: 1700000000 }
      : subscription
  );

  const result = await BillingService.syncStripeSubscription(stripeSubscription);

  assert.equal(result.status, 'active');
  assert.equal(result.stripeCustomerId, 'cus_456');
  assert.equal(result.stripeSubscriptionId, 'sub_active');
  assert.equal(result.plan, 'clinic');
});

test('syncStripeSubscription marks trial as used and stores trial window when Stripe status is trialing', async () => {
  const existingDoc = {
    _id: 'doc-trial',
    ownerType: 'user',
    ownerId: 'user-42',
    plan: 'professional',
    status: 'active',
    trialUsed: false,
    trialStartedAt: null,
    trialEndsAt: null,
    currentPeriodEnd: new Date('2024-01-01T00:00:00.000Z'),
    cancelAtPeriodEnd: false
  };

  Subscription.findOne = async (query) => {
    if (query && query.stripeSubscriptionId === 'sub_trial') {
      return existingDoc;
    }
    if (query && query.ownerType === 'user' && query.ownerId === 'user-42') {
      return existingDoc;
    }
    return null;
  };

  Subscription.findOneAndUpdate = async ({ _id }, update) => {
    assert.equal(_id, 'doc-trial');
    assert.equal(update.$set.trialUsed, true);
    assert.equal(update.$set.trialStartedAt instanceof Date, true);
    assert.equal(update.$set.trialEndsAt instanceof Date, true);
    return { ...existingDoc, ...update.$set };
  };

  const stripeSubscription = {
    id: 'sub_trial',
    status: 'trialing',
    customer: 'cus_trial',
    metadata: { med1peOwnerType: 'user', med1peOwnerId: 'user-42', med1pePlan: 'professional' },
    current_period_end: 1767225600,
    trial_start: 1750000000,
    trial_end: 1757200000,
    cancel_at_period_end: false,
    items: {
      data: [{ price: { id: 'price_professional' }, current_period_end: 1767225600 }]
    }
  };

  BillingService.getCurrentStripeSubscriptionState = async (stripeSubscription) => stripeSubscription;

  const result = await BillingService.syncStripeSubscription(stripeSubscription);

  assert.equal(result.trialUsed, true);
  assert.equal(result.trialStartedAt instanceof Date, true);
  assert.equal(result.trialEndsAt instanceof Date, true);
  assert.equal(result.status, 'trialing');
});

test('syncStripeSubscription never clears trialUsed after it has already been consumed', async () => {
  const existingDoc = {
    _id: 'doc-trial-used',
    ownerType: 'user',
    ownerId: 'user-88',
    plan: 'professional',
    status: 'trialing',
    trialUsed: true,
    trialStartedAt: new Date('2026-09-01T00:00:00.000Z'),
    trialEndsAt: new Date('2026-09-08T00:00:00.000Z'),
    currentPeriodEnd: new Date('2026-09-08T00:00:00.000Z'),
    cancelAtPeriodEnd: false
  };

  Subscription.findOne = async (query) => {
    if (query && query.stripeSubscriptionId === 'sub_after_trial') {
      return existingDoc;
    }
    if (query && query.ownerType === 'user' && query.ownerId === 'user-88') {
      return existingDoc;
    }
    return null;
  };

  Subscription.findOneAndUpdate = async ({ _id }, update) => {
    assert.equal(update.$set.trialUsed, true);
    assert.equal(update.$set.status, 'active');
    return { ...existingDoc, ...update.$set };
  };

  BillingService.getCurrentStripeSubscriptionState = async (stripeSubscription) => ({
    ...stripeSubscription,
    status: 'active',
    customer: 'cus_after_trial',
    metadata: { med1peOwnerType: 'user', med1peOwnerId: 'user-88', med1pePlan: 'professional' },
    current_period_end: 1767225600,
    cancel_at_period_end: false,
    items: {
      data: [{ price: { id: 'price_professional' }, current_period_end: 1767225600 }]
    }
  });

  const result = await BillingService.syncStripeSubscription({
    id: 'sub_after_trial',
    status: 'active',
    customer: 'cus_after_trial',
    metadata: { med1peOwnerType: 'user', med1peOwnerId: 'user-88', med1pePlan: 'professional' },
    current_period_end: 1767225600,
    cancel_at_period_end: false,
    items: {
      data: [{ price: { id: 'price_professional' }, current_period_end: 1767225600 }]
    }
  });

  assert.equal(result.trialUsed, true);
  assert.equal(result.status, 'active');
});

test('syncStripeSubscription uses mocked stripe state when available', async () => {
  const existingDoc = {
    _id: 'doc-1',
    ownerType: 'clinic',
    ownerId: 'clinic-abc',
    plan: 'clinic',
    status: 'pending',
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_active',
    stripePriceId: 'old_price',
    currentPeriodEnd: new Date('2024-01-01T00:00:00.000Z'),
    cancelAtPeriodEnd: false
  };

  Subscription.findOne = async (query) => {
    if (query && query.stripeSubscriptionId === 'sub_active') return existingDoc;
    if (query && query.ownerType === 'clinic' && query.ownerId === 'clinic-abc') return existingDoc;
    return null;
  };

  Subscription.findOneAndUpdate = async ({ _id }, update) => ({
    ...existingDoc,
    ...update.$set
  });

  BillingService.getCurrentStripeSubscriptionState = async (stripeSubscription) => ({
    id: 'sub_active',
    status: 'active',
    customer: 'cus_456',
    metadata: { med1peOwnerType: 'clinic', med1peOwnerId: 'clinic-abc', med1pePlan: 'clinic' },
    current_period_end: 1767225600,
    cancel_at_period_end: false,
    items: { data: [{ price: { id: 'price_clinic' } }] }
  });

  const result = await BillingService.syncStripeSubscription({
    id: 'sub_active',
    status: 'active',
    customer: 'cus_456',
    metadata: { med1peOwnerType: 'clinic', med1peOwnerId: 'clinic-abc', med1pePlan: 'clinic' },
    current_period_end: 1767225600,
    cancel_at_period_end: false,
    items: { data: [{ price: { id: 'price_clinic' } }] }
  });

  assert.equal(result.status, 'active');
  assert.equal(result.stripeCustomerId, 'cus_456');
});

process.on('exit', () => {
  Subscription.findOne = originalFindOne;
  Subscription.findOneAndUpdate = originalFindOneAndUpdate;
  BillingService.getCurrentStripeSubscriptionState = originalGetCurrentStripeSubscriptionState;
});
