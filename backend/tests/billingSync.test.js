const test = require('node:test');
const assert = require('node:assert/strict');

process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'test_key';
process.env.STRIPE_PRICE_PROFESSIONAL = process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional';
process.env.STRIPE_PRICE_CLINIC = process.env.STRIPE_PRICE_CLINIC || 'price_clinic';

const Subscription = require('../src/modules/billing/subscription.model');
const BillingService = require('../src/modules/billing/billing.service');

const originalFindOne = Subscription.findOne;
const originalFindByIdAndUpdate = Subscription.findByIdAndUpdate;
const originalFindOneAndUpdate = Subscription.findOneAndUpdate;

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
    if (query && query.stripeSubscriptionId === 'sub_active') {
      return existingDoc;
    }

    if (query && query.ownerType === 'clinic' && query.ownerId === 'clinic-abc') {
      return existingDoc;
    }

    return null;
  };

  Subscription.findByIdAndUpdate = async (_id, update) => {
    assert.equal(_id, 'doc-1');
    assert.equal(update.$set.status, 'active');
    assert.equal(update.$set.plan, 'clinic');
    assert.equal(update.$set.ownerType, 'clinic');
    assert.equal(update.$set.ownerId, 'clinic-abc');
    return { ...existingDoc, ...update.$set };
  };

  const stripeSubscription = {
    id: 'sub_active',
    status: 'active',
    customer: 'cus_456',
    metadata: { med1peOwnerType: 'clinic', med1peOwnerId: 'clinic-abc', med1pePlan: 'clinic' },
    current_period_end: 1767225600,
    cancel_at_period_end: false,
    items: {
      data: [{ price: { id: 'price_clinic' } }]
    }
  };

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

  Subscription.findByIdAndUpdate = async (_id, update) => {
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

  Subscription.findByIdAndUpdate = async (_id, update) => {
    assert.equal(update.$set.trialUsed, true);
    assert.equal(update.$set.status, 'active');
    return { ...existingDoc, ...update.$set };
  };

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

process.on('exit', () => {
  Subscription.findOne = originalFindOne;
  Subscription.findByIdAndUpdate = originalFindByIdAndUpdate;
  Subscription.findOneAndUpdate = originalFindOneAndUpdate;
});
