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
const origFindBlockingStripeSubscription = BillingService.findBlockingStripeSubscription;
const origFindOpenCheckoutSession = BillingService.findOpenCheckoutSession;

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

test('checkout recupera uma falha temporária, retoma a sessão aberta e substitui a sessão expirada', async (t) => {
  let subscription = {
    _id: 'doc-1',
    ownerType: 'clinic',
    ownerId: 'clinic-abc',
    status: 'pending',
    plan: 'clinic',
    stripeCustomerId: 'cus_test'
  };
  let openSession;
  const createCalls = [];

  t.after(() => {
    Subscription.findOne = origFindOne;
    Subscription.findOneAndUpdate = origFindOneAndUpdate;
    User.findById = origUserFindById;
    BillingService.createOrRetrieveCustomer = origCreateOrRetrieveCustomer;
    BillingService.createCheckoutSession = origCreateCheckoutSession;
    BillingService.findBlockingStripeSubscription = origFindBlockingStripeSubscription;
    BillingService.findOpenCheckoutSession = origFindOpenCheckoutSession;
  });

  Subscription.findOne = async () => subscription;
  Subscription.findOneAndUpdate = async (_filter, update) => {
    subscription = { ...subscription, ...update.$set };
    return subscription;
  };
  User.findById = async (id) => ({ _id: id, name: 'Teste', email: 'teste@example.test' });
  BillingService.createOrRetrieveCustomer = async () => subscription.stripeCustomerId;
  BillingService.findBlockingStripeSubscription = async () => null;
  BillingService.findOpenCheckoutSession = async () => openSession;
  BillingService.createCheckoutSession = async (params) => {
    createCalls.push(params);
    if (createCalls.length === 1) throw new Error('stripe temporarily unavailable');
    openSession = { url: 'https://checkout.example.test/' + createCalls.length, metadata: { med1pePlan: 'clinic' } };
    return openSession;
  };

  const checkout = async (onError = (err) => { throw err; }) => {
    const { req, res } = makeReqRes({ plan: 'clinic' }, 'user-1', 'clinic-abc');
    await billingController.checkout(req, res, onError);
    return res;
  };

  await assert.rejects(checkout(), /stripe temporarily unavailable/);
  const resumed = await checkout();
  assert.equal(resumed.statusCode, 200);
  assert.equal(resumed.payload.url, openSession.url);
  assert.deepEqual(createCalls[1], createCalls[0]);

  const reopened = await checkout();
  assert.equal(reopened.payload.url, resumed.payload.url);
  assert.equal(createCalls.length, 2);

  openSession = null;
  subscription.checkoutAttempt.expiresAt = new Date(0);
  const refreshed = await checkout();
  assert.equal(refreshed.statusCode, 200);
  assert.notEqual(refreshed.payload.url, resumed.payload.url);
  assert.notEqual(createCalls[2].attemptId, createCalls[1].attemptId);
});
