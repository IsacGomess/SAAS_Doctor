const test = require('node:test');
const assert = require('node:assert/strict');

process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'test_key';
process.env.STRIPE_PRICE_PROFESSIONAL = process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional';
process.env.STRIPE_PRICE_CLINIC = process.env.STRIPE_PRICE_CLINIC || 'price_clinic';

const Subscription = require('../src/modules/billing/subscription.model');
const BillingService = require('../src/modules/billing/billing.service');
const billingController = require('../src/modules/billing/billing.controller');
const User = require('../src/modules/users/user.model');

const originalFindOne = Subscription.findOne;
const originalFindOneAndUpdate = Subscription.findOneAndUpdate;
const originalUserFindById = User.findById;
const originalCreateOrRetrieveCustomer = BillingService.createOrRetrieveCustomer;
const originalCreateCheckoutSession = BillingService.createCheckoutSession;

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

test('owner new to trial gets trial_period_days=7 on checkout', async () => {
  let lastCheckoutArgs = null;

  Subscription.findOne = async ({ ownerType, ownerId }) => {
    if (ownerType === 'user' && ownerId === 'user-1') return null;
    return null;
  };
  Subscription.findOneAndUpdate = async () => ({
    ownerType: 'user',
    ownerId: 'user-1',
    plan: 'professional',
    status: 'pending',
    trialUsed: false
  });

  User.findById = async () => ({ _id: 'user-1', email: 'a@a.com', name: 'User' });
  BillingService.createOrRetrieveCustomer = async () => 'cus_trial';
  BillingService.createCheckoutSession = async (args) => {
    lastCheckoutArgs = args;
    return { url: 'https://stripe.checkout/session' };
  };

  const { req, res } = makeReqRes({ plan: 'professional' }, 'user-1', null, 'administrador');
  await billingController.checkout(req, res, (err) => { if (err) throw err; });

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);
  assert.equal(lastCheckoutArgs.trialEligible, true);
  assert.equal(res.payload.url, 'https://stripe.checkout/session');
});

test('owner with trialUsed true does not receive trial_period_days on checkout', async () => {
  let lastCheckoutArgs = null;

  Subscription.findOne = async (query) => {
    if (query && query.status && Array.isArray(query.status.$in)) {
      return null;
    }

    return {
      ownerType: query.ownerType,
      ownerId: query.ownerId,
      status: 'canceled',
      trialUsed: true
    };
  };
  Subscription.findOneAndUpdate = async () => ({
    ownerType: 'user',
    ownerId: 'user-1',
    plan: 'professional',
    status: 'pending',
    trialUsed: true
  });

  User.findById = async () => ({ _id: 'user-1', email: 'a@a.com', name: 'User' });
  BillingService.createOrRetrieveCustomer = async () => 'cus_paid';
  BillingService.createCheckoutSession = async (args) => {
    lastCheckoutArgs = args;
    return { url: 'https://stripe.checkout/session' };
  };

  const { req, res } = makeReqRes({ plan: 'professional' }, 'user-1', null, 'administrador');
  await billingController.checkout(req, res, (err) => { if (err) throw err; });

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);
  assert.equal(lastCheckoutArgs.trialEligible, false);
});

process.on('exit', () => {
  Subscription.findOne = originalFindOne;
  Subscription.findOneAndUpdate = originalFindOneAndUpdate;
  User.findById = originalUserFindById;
  BillingService.createOrRetrieveCustomer = originalCreateOrRetrieveCustomer;
  BillingService.createCheckoutSession = originalCreateCheckoutSession;
});
