const test = require('node:test');
const assert = require('node:assert/strict');

process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'test_key';
process.env.STRIPE_PRICE_PROFESSIONAL = process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional';
process.env.STRIPE_PRICE_CLINIC = process.env.STRIPE_PRICE_CLINIC || 'price_clinic';

const billingController = require('../src/modules/billing/billing.controller');
const Subscription = require('../src/modules/billing/subscription.model');
const User = require('../src/modules/users/user.model');
const BillingService = require('../src/modules/billing/billing.service');

// Preserve originals
const origFindOne = Subscription.findOne;
const origFindOneAndUpdate = Subscription.findOneAndUpdate;
const origUserFindById = User.findById;
const origCreateOrRetrieveCustomer = BillingService.createOrRetrieveCustomer;
const origCreateCheckoutSession = BillingService.createCheckoutSession;

// Helper to create mock req/res
function makeReqRes(body, userId = 'user-1', clinicaId = null, role = 'administrador') {
  const req = {
    body,
    userId,
    clinicaId,
    user: { role }
  };

  let statusCode = 200;
  let payload = null;

  const res = {
    status(code) { statusCode = code; return this; },
    json(data) { payload = data; return this; },
    get statusCode() { return statusCode; },
    get payload() { return payload; }
  };

  return { req, res };
}

test('two sequential checkouts for same owner -> second is rejected', async () => {
  // in-memory store to simulate DB
  const store = {};

  Subscription.findOne = async (query) => {
    // simulate lookup by ownerType/ownerId and status
    if (query && query.ownerType && query.ownerId) {
      const key = `${query.ownerType}:${query.ownerId}`;
      return store[key] || null;
    }
    return null;
  };

  Subscription.findOneAndUpdate = async (filter, update, opts) => {
    const key = `${filter.ownerType}:${filter.ownerId}`;
    if (!store[key]) {
      // create new pending reservation
      store[key] = {
        _id: 'doc-1',
        ownerType: filter.ownerType,
        ownerId: filter.ownerId,
        plan: update.$setOnInsert ? update.$setOnInsert.plan : 'clinic',
        status: update.$setOnInsert ? update.$setOnInsert.status : 'pending',
        stripeCustomerId: update.$setOnInsert ? update.$setOnInsert.stripeCustomerId : null
      };
      return store[key];
    }
    // if exists, return existing
    return store[key];
  };

  User.findById = async (id) => ({ _id: id, name: 'Test', email: 't@test', clinicaId: 'clinic-abc', role: 'administrador' });
  BillingService.createOrRetrieveCustomer = async () => 'cus_test';
  BillingService.createCheckoutSession = async () => ({ url: 'https://stripe.checkout/session' });

  // First call (should create reservation and return session url)
  const { req: req1, res: res1 } = makeReqRes({ plan: 'clinic' }, 'user-1', 'clinic-abc', 'administrador');
  await billingController.checkout(req1, res1, (err) => { if (err) throw err; });
  assert.equal(res1.statusCode, 200);
  assert.equal(res1.payload.success, true);
  assert.ok(res1.payload.url);

  // Second call (should detect reservation and return 409)
  const { req: req2, res: res2 } = makeReqRes({ plan: 'clinic' }, 'user-1', 'clinic-abc', 'administrador');
  await billingController.checkout(req2, res2, (err) => { if (err) throw err; });
  assert.equal(res2.statusCode, 409);
  assert.equal(res2.payload.code, 'SUBSCRIPTION_ALREADY_ACTIVE');

  // cleanup
  Subscription.findOne = origFindOne;
  Subscription.findOneAndUpdate = origFindOneAndUpdate;
  User.findById = origUserFindById;
  BillingService.createOrRetrieveCustomer = origCreateOrRetrieveCustomer;
  BillingService.createCheckoutSession = origCreateCheckoutSession;
});
