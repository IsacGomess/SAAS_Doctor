const test = require('node:test');
const assert = require('node:assert/strict');

process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'test_key';
process.env.STRIPE_PRICE_CLINIC = process.env.STRIPE_PRICE_CLINIC || 'price_clinic';
process.env.STRIPE_PRICE_EXTRA_PROFESSIONAL = process.env.STRIPE_PRICE_EXTRA_PROFESSIONAL || 'price_extra_professional';

const BillingService = require('../src/modules/billing/billing.service');
const User = require('../src/modules/users/user.model');
const Subscription = require('../src/modules/billing/subscription.model');
const ProcessedWebhookEvent = require('../src/modules/billing/processed-webhook-event.model');
const { addMembroSchemaWithRegistro } = require('../src/modules/users/user.validator');

const originalCountDocuments = User.countDocuments;
const originalFindOne = Subscription.findOne;
const originalFindOneAndUpdate = Subscription.findOneAndUpdate;
const originalCreateProcessedWebhookEvent = ProcessedWebhookEvent.create;
const originalFindOneProcessedWebhookEvent = ProcessedWebhookEvent.findOne;
const originalFindOneAndUpdateProcessedWebhookEvent = ProcessedWebhookEvent.findOneAndUpdate;
const originalGetCurrentStripeSubscriptionState = BillingService.getCurrentStripeSubscriptionState;

function resetStubs() {
  User.countDocuments = async () => 6;
  Subscription.findOne = async () => ({
    _id: 'sub-1',
    ownerType: 'clinic',
    ownerId: 'clinic-123',
    plan: 'clinic',
    status: 'active',
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_123',
    stripePriceId: 'price_clinic',
    currentPeriodEnd: new Date('2026-10-01T00:00:00.000Z'),
    cancelAtPeriodEnd: false,
    trialUsed: false,
    trialEndsAt: null,
    lastWebhookEventId: null,
    lastWebhookProcessedAt: null,
    processedWebhookEventIds: []
  });
  Subscription.findOneAndUpdate = async (_query, update) => ({
    ...update.$set,
    _id: 'sub-1',
    ownerType: 'clinic',
    ownerId: 'clinic-123',
    plan: 'clinic'
  });
  ProcessedWebhookEvent.create = async () => ({
    eventId: 'evt_test',
    stripeSubscriptionId: 'sub_123',
    processedAt: new Date()
  });
  ProcessedWebhookEvent.findOne = async () => null;
  ProcessedWebhookEvent.findOneAndUpdate = async (_query, update) => ({
    eventId: 'evt_test',
    status: update.$set.status,
    processedAt: update.$set.processedAt,
    errorMessage: update.$set.errorMessage,
    ...update.$set
  });
  BillingService.getCurrentStripeSubscriptionState = async (stripeSubscription) => stripeSubscription;
}

test('recepcionista without registroProf is accepted by member schema', () => {
  const parsed = addMembroSchemaWithRegistro.parse({
    name: 'Maria',
    email: 'maria@teste.com',
    password: 'Senha@123',
    role: 'recepcionista',
    registroProf: ''
  });

  assert.equal(parsed.role, 'recepcionista');
  assert.equal(parsed.registroProf, undefined);
});

test('count extra seats excludes administradores and recepcionistas from the clinic total', async () => {
  resetStubs();
  User.countDocuments = async (query) => {
    const roleFilter = query.role;
    assert.deepEqual(roleFilter, { $in: ['medico', 'enfermeiro', 'fisioterapeuta', 'nutricionista', 'esteticista', 'dentista', 'nutrologo'] });
    return 6;
  };

  const summary = await BillingService.getClinicSeatSummary('clinic-123');

  assert.equal(summary.includedSeats, 5);
  assert.equal(summary.activeProfessionalCount, 6);
  assert.equal(summary.extraProfessionals, 1);
  assert.equal(summary.monthlyPriceCents, 4990);
  assert.equal(summary.billingCycleLabel, 'próximo ciclo');
});

test('reconcileClinicSeatSubscription updates quantity for the extra professional item without duplicating it', async () => {
  resetStubs();
  const calls = [];

  BillingService._stripeClient = {
    subscriptions: {
      retrieve: async () => ({
        id: 'sub_123',
        status: 'active',
        customer: 'cus_123',
        metadata: { med1peOwnerType: 'clinic', med1peOwnerId: 'clinic-123', med1pePlan: 'clinic' },
        items: {
          data: [{ id: 'si_extra', price: { id: process.env.STRIPE_PRICE_EXTRA_PROFESSIONAL }, quantity: 0 }]
        }
      })
    },
    subscriptionItems: {
      create: async (payload) => {
        calls.push(['create', payload]);
        return { id: 'si_new', quantity: payload.quantity };
      },
      update: async (id, payload) => {
        calls.push(['update', id, payload]);
        return { id, quantity: payload.quantity };
      },
      del: async (id) => {
        calls.push(['delete', id]);
        return { id, deleted: true };
      }
    }
  };

  const result = await BillingService.reconcileClinicSeatSubscription('clinic-123', { activeProfessionalCount: 6 });

  assert.equal(result.action, 'updated');
  assert.equal(result.extraProfessionals, 1);
  assert.equal(calls[0][0], 'update');
  assert.equal(calls[0][2].quantity, 1);
});

test('reconcileClinicSeatSubscription removes extra item when count is within included limit', async () => {
  resetStubs();
  const calls = [];

  BillingService._stripeClient = {
    subscriptions: {
      retrieve: async () => ({
        id: 'sub_123',
        status: 'active',
        customer: 'cus_123',
        metadata: { med1peOwnerType: 'clinic', med1peOwnerId: 'clinic-123', med1pePlan: 'clinic' },
        items: {
          data: [{ id: 'si_extra', price: { id: process.env.STRIPE_PRICE_EXTRA_PROFESSIONAL }, quantity: 2 }]
        }
      })
    },
    subscriptionItems: {
      del: async (id) => {
        calls.push(['delete', id]);
        return { id, deleted: true };
      }
    }
  };

  const result = await BillingService.reconcileClinicSeatSubscription('clinic-123', { activeProfessionalCount: 5 });

  assert.equal(result.action, 'removed');
  assert.equal(result.extraProfessionals, 0);
  assert.equal(calls[0][1], 'si_extra');
});

test('webhook sync is idempotent for duplicate subscription updates', async () => {
  resetStubs();
  let seen = [];
  Subscription.findOne = async (query) => {
    if (query && query.stripeSubscriptionId === 'sub_123') {
      return {
        _id: 'sub-1',
        ownerType: 'clinic',
        ownerId: 'clinic-123',
        plan: 'clinic',
        status: 'active',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        stripePriceId: 'price_clinic',
        currentPeriodEnd: new Date('2026-10-01T00:00:00.000Z'),
        trialUsed: false,
        lastWebhookEventId: 'evt_123',
        processedWebhookEventIds: ['evt_123']
      };
    }
    return null;
  };
  Subscription.findOneAndUpdate = async (_query, update) => {
    seen.push(update.$set.lastWebhookEventId);
    return { _id: 'sub-1', ...update.$set };
  };

  const result = await BillingService.syncStripeSubscription({
    id: 'sub_123',
    status: 'active',
    customer: 'cus_123',
    metadata: { med1peOwnerType: 'clinic', med1peOwnerId: 'clinic-123', med1pePlan: 'clinic' },
    current_period_end: 1767225600,
    cancel_at_period_end: false,
    items: { data: [{ price: { id: 'price_clinic' }, current_period_end: 1767225600 }] }
  }, { eventId: 'evt_123' });

  assert.equal(result.lastWebhookEventId, 'evt_123');
  assert.deepEqual(seen, []);
});

test('webhook sync accepts a valid older event id that was not processed yet even when a newer one already exists', async () => {
  let seen = [];
  Subscription.findOne = async (query) => {
    if (query && query.stripeSubscriptionId === 'sub_123') {
      return {
        _id: 'sub-1',
        ownerType: 'clinic',
        ownerId: 'clinic-123',
        plan: 'clinic',
        status: 'active',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        stripePriceId: 'price_clinic',
        currentPeriodEnd: new Date('2026-10-01T00:00:00.000Z'),
        trialUsed: false,
        lastWebhookEventId: 'evt_999',
        processedWebhookEventIds: ['evt_999']
      };
    }
    return null;
  };
  Subscription.findOneAndUpdate = async (_query, update) => {
    seen.push(update.$set.lastWebhookEventId);
    return { _id: 'sub-1', ...update.$set };
  };

  const result = await BillingService.syncStripeSubscription({
    id: 'sub_123',
    status: 'active',
    customer: 'cus_123',
    metadata: { med1peOwnerType: 'clinic', med1peOwnerId: 'clinic-123', med1pePlan: 'clinic' },
    current_period_end: 1767225600,
    cancel_at_period_end: false,
    items: { data: [{ price: { id: 'price_clinic' }, current_period_end: 1767225600 }] }
  }, { eventId: 'evt_123' });

  assert.equal(result.lastWebhookEventId, 'evt_123');
  assert.deepEqual(seen, ['evt_123']);
});

test('webhook sync deduplicates concurrent deliveries of the same event id atomically', async () => {
  resetStubs();
  let calls = 0;
  Subscription.findOne = async () => ({
    _id: 'sub-1',
    ownerType: 'clinic',
    ownerId: 'clinic-123',
    plan: 'clinic',
    status: 'active',
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_123',
    stripePriceId: 'price_clinic',
    currentPeriodEnd: new Date('2026-10-01T00:00:00.000Z'),
    trialUsed: false,
    lastWebhookEventId: null,
    processedWebhookEventIds: []
  });
  Subscription.findOneAndUpdate = async (_query, update) => {
    calls += 1;
    return { _id: 'sub-1', ...update.$set };
  };

  let activeEvent = null;
  ProcessedWebhookEvent.create = async ({ eventId, ...payload }) => {
    if (activeEvent && activeEvent.eventId === eventId) {
      const error = new Error('duplicate event id');
      error.code = 11000;
      throw error;
    }

    activeEvent = {
      eventId,
      status: 'processing',
      processingLeaseExpiresAt: new Date(Date.now() + 60_000),
      ...payload
    };

    return activeEvent;
  };
  ProcessedWebhookEvent.findOne = async ({ eventId }) => {
    if (!activeEvent || activeEvent.eventId !== eventId) {
      return null;
    }

    return activeEvent;
  };
  ProcessedWebhookEvent.findOneAndUpdate = async (_query, update) => {
    activeEvent = {
      eventId: 'evt_concurrent',
      status: update.$set.status,
      processingLeaseExpiresAt: update.$set.processingLeaseExpiresAt,
      ...update.$set
    };
    return activeEvent;
  };

  await Promise.all([
    BillingService.syncStripeSubscription({
      id: 'sub_123',
      status: 'active',
      customer: 'cus_123',
      metadata: { med1peOwnerType: 'clinic', med1peOwnerId: 'clinic-123', med1pePlan: 'clinic' },
      current_period_end: 1767225600,
      cancel_at_period_end: false,
      items: { data: [{ price: { id: 'price_clinic' }, current_period_end: 1767225600 }] }
    }, { eventId: 'evt_concurrent' }),
    BillingService.syncStripeSubscription({
      id: 'sub_123',
      status: 'active',
      customer: 'cus_123',
      metadata: { med1peOwnerType: 'clinic', med1peOwnerId: 'clinic-123', med1pePlan: 'clinic' },
      current_period_end: 1767225600,
      cancel_at_period_end: false,
      items: { data: [{ price: { id: 'price_clinic' }, current_period_end: 1767225600 }] }
    }, { eventId: 'evt_concurrent' })
  ]);

  assert.equal(calls, 1);
});

test('webhook sync keeps current subscription state when a stale event arrives after a newer update', async () => {
  const newerDate = new Date('2026-09-20T12:00:00.000Z');
  const staleDate = new Date('2026-09-18T12:00:00.000Z');

  Subscription.findOne = async () => ({
    _id: 'sub-1',
    ownerType: 'clinic',
    ownerId: 'clinic-123',
    plan: 'clinic',
    status: 'active',
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_123',
    stripePriceId: 'price_clinic',
    currentPeriodEnd: new Date('2026-10-01T00:00:00.000Z'),
    trialUsed: false,
    lastWebhookEventId: 'evt_newer',
    lastWebhookProcessedAt: newerDate,
    processedWebhookEventIds: ['evt_newer']
  });

  const currentStripeState = {
    id: 'sub_123',
    status: 'active',
    customer: 'cus_123',
    metadata: { med1peOwnerType: 'clinic', med1peOwnerId: 'clinic-123', med1pePlan: 'clinic' },
    current_period_end: 1767225600,
    cancel_at_period_end: false,
    items: { data: [{ price: { id: 'price_clinic' }, current_period_end: 1767225600, quantity: 1 }] }
  };

  BillingService.getCurrentStripeSubscriptionState = async () => currentStripeState;
  ProcessedWebhookEvent.create = async () => ({
    eventId: 'evt_stale',
    stripeSubscriptionId: 'sub_123',
    processedAt: new Date()
  });
  ProcessedWebhookEvent.findOne = async () => null;
  ProcessedWebhookEvent.findOneAndUpdate = async (_query, update) => ({
    eventId: 'evt_stale',
    status: update.$set.status,
    ...update.$set
  });

  const result = await BillingService.syncStripeSubscription({
    id: 'sub_123',
    status: 'trialing',
    customer: 'cus_123',
    metadata: { med1peOwnerType: 'clinic', med1peOwnerId: 'clinic-123', med1pePlan: 'clinic' },
    current_period_end: 1767225600,
    cancel_at_period_end: false,
    items: { data: [{ price: { id: 'price_clinic' }, current_period_end: 1767225600, quantity: 1 }] }
  }, { eventId: 'evt_stale', eventCreatedAt: staleDate });

  assert.equal(result.status, 'active');
  assert.equal(result.plan, 'clinic');
});

test('webhook sync resumes a previously failed event instead of treating it as a final duplicate', async () => {
  resetStubs();
  let finalStatus = 'failed';

  Subscription.findOne = async () => ({
    _id: 'sub-1',
    ownerType: 'clinic',
    ownerId: 'clinic-123',
    plan: 'clinic',
    status: 'active',
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_123',
    stripePriceId: 'price_clinic',
    currentPeriodEnd: new Date('2026-10-01T00:00:00.000Z'),
    trialUsed: false,
    lastWebhookEventId: null,
    lastWebhookProcessedAt: null,
    processedWebhookEventIds: []
  });
  Subscription.findOneAndUpdate = async (_query, update) => ({
    _id: 'sub-1',
    ...update.$set
  });
  ProcessedWebhookEvent.findOne = async ({ eventId }) => ({
    eventId,
    status: 'failed',
    stripeSubscriptionId: 'sub_123',
    ownerType: 'clinic',
    ownerId: 'clinic-123',
    startedAt: new Date('2026-09-18T12:00:00.000Z'),
    eventCreatedAt: new Date('2026-09-18T12:00:00.000Z')
  });
  ProcessedWebhookEvent.findOneAndUpdate = async (_query, update) => {
    finalStatus = update.$set.status;
    return { eventId: 'evt_retry', ...update.$set };
  };
  BillingService.getCurrentStripeSubscriptionState = async (stripeSubscription) => ({
    ...stripeSubscription,
    status: 'active',
    items: { data: [{ price: { id: 'price_clinic' }, current_period_end: 1767225600 }] }
  });

  const result = await BillingService.syncStripeSubscription({
    id: 'sub_123',
    status: 'active',
    customer: 'cus_123',
    metadata: { med1peOwnerType: 'clinic', med1peOwnerId: 'clinic-123', med1pePlan: 'clinic' },
    current_period_end: 1767225600,
    cancel_at_period_end: false,
    items: { data: [{ price: { id: 'price_clinic' }, current_period_end: 1767225600 }] }
  }, { eventId: 'evt_retry', eventCreatedAt: new Date('2026-09-18T12:00:00.000Z') });

  assert.equal(result.status, 'active');
  assert.equal(finalStatus, 'processed');
});

test('webhook sync reclaims a lease after expiration when the original worker crashed', async () => {
  const now = new Date();
  const expiredLease = new Date(now.getTime() - 60_001);

  ProcessedWebhookEvent.findOne = async () => ({
    eventId: 'evt_lease_expired',
    status: 'processing',
    startedAt: expiredLease,
    processingLeaseExpiresAt: expiredLease,
    stripeSubscriptionId: 'sub_123',
    ownerType: 'clinic',
    ownerId: 'clinic-123'
  });

  let reclaimed = false;
  ProcessedWebhookEvent.findOneAndUpdate = async (query, update) => {
    reclaimed = true;
    return {
      eventId: 'evt_lease_expired',
      status: update.$set.status,
      processingLeaseExpiresAt: update.$set.processingLeaseExpiresAt,
      ...update.$set
    };
  };

  const result = await BillingService.reserveWebhookEventForProcessing({
    eventId: 'evt_lease_expired',
    stripeSubscriptionId: 'sub_123',
    ownerType: 'clinic',
    ownerId: 'clinic-123',
    eventCreatedAt: now
  });

  assert.equal(reclaimed, true);
  assert.equal(result.shouldProcess, true);
  assert.equal(result.status, 'processing');
});

test('webhook sync does not hand the same event to another worker while the active lease is still valid', async () => {
  const now = new Date();
  const futureLease = new Date(now.getTime() + 60_000);

  ProcessedWebhookEvent.findOne = async () => ({
    eventId: 'evt_active_lease',
    status: 'processing',
    startedAt: now,
    processingLeaseExpiresAt: futureLease,
    stripeSubscriptionId: 'sub_123',
    ownerType: 'clinic',
    ownerId: 'clinic-123'
  });

  let reclaimed = false;
  ProcessedWebhookEvent.findOneAndUpdate = async () => {
    reclaimed = true;
    return { eventId: 'evt_active_lease', status: 'processing' };
  };

  const result = await BillingService.reserveWebhookEventForProcessing({
    eventId: 'evt_active_lease',
    stripeSubscriptionId: 'sub_123',
    ownerType: 'clinic',
    ownerId: 'clinic-123',
    eventCreatedAt: now
  });

  assert.equal(reclaimed, false);
  assert.equal(result.shouldProcess, false);
  assert.equal(result.status, 'processing');
});

process.on('exit', () => {
  User.countDocuments = originalCountDocuments;
  Subscription.findOne = originalFindOne;
  Subscription.findOneAndUpdate = originalFindOneAndUpdate;
  ProcessedWebhookEvent.create = originalCreateProcessedWebhookEvent;
  ProcessedWebhookEvent.findOne = originalFindOneProcessedWebhookEvent;
  ProcessedWebhookEvent.findOneAndUpdate = originalFindOneAndUpdateProcessedWebhookEvent;
  BillingService.getCurrentStripeSubscriptionState = originalGetCurrentStripeSubscriptionState;
});
