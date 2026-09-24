const test = require('node:test');
const assert = require('node:assert/strict');

const Subscription = require('../src/modules/billing/subscription.model');
const middleware = require('../src/middlewares/requireActiveSubscription');

const originalFindOne = Subscription.findOne;

function makeResponse() {
  let statusCode = 200;
  let payload;

  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    },
    getStatusCode() {
      return statusCode;
    },
    getPayload() {
      return payload;
    }
  };
}

test('resolveOwnerFromRequest uses clinic context when available', () => {
  const owner = middleware.resolveOwnerFromRequest({ userId: 'user-1', clinicaId: 'clinic-1' });

  assert.deepEqual(owner, { ownerType: 'clinic', ownerId: 'clinic-1' });
});

test('resolveOwnerFromRequest falls back to user when there is no clinic context', () => {
  const owner = middleware.resolveOwnerFromRequest({ userId: 'user-1' });

  assert.deepEqual(owner, { ownerType: 'user', ownerId: 'user-1' });
});

test('requireActiveSubscription allows active and trialing subscriptions', async () => {
  Subscription.findOne = async () => ({ status: 'active', ownerType: 'user', ownerId: 'user-1' });

  const req = { userId: 'user-1', clinicaId: null };
  const res = makeResponse();
  let nextCalled = false;

  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.getStatusCode(), 200);
  assert.equal(req.subscription.status, 'active');

  Subscription.findOne = async () => ({ status: 'trialing', ownerType: 'user', ownerId: 'user-1' });

  const trialReq = { userId: 'user-1', clinicaId: null };
  const trialRes = makeResponse();
  let trialNextCalled = false;

  await middleware(trialReq, trialRes, () => {
    trialNextCalled = true;
  });

  assert.equal(trialNextCalled, true);
  assert.equal(trialReq.subscription.status, 'trialing');
});

test('requireActiveSubscription blocks missing or inactive subscriptions', async () => {
  Subscription.findOne = async () => null;

  const req = { userId: 'user-1', clinicaId: null };
  const res = makeResponse();
  let nextCalled = false;

  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.getStatusCode(), 403);
  assert.deepEqual(res.getPayload(), {
    success: false,
    code: 'SUBSCRIPTION_REQUIRED',
    message: 'É necessária uma assinatura ativa para utilizar este recurso.'
  });

  Subscription.findOne = async () => ({ status: 'canceled', ownerType: 'user', ownerId: 'user-1' });

  const canceledReq = { userId: 'user-1', clinicaId: null };
  const canceledRes = makeResponse();
  let canceledNextCalled = false;

  await middleware(canceledReq, canceledRes, () => {
    canceledNextCalled = true;
  });

  assert.equal(canceledNextCalled, false);
  assert.equal(canceledRes.getStatusCode(), 403);
  assert.equal(canceledRes.getPayload().code, 'SUBSCRIPTION_REQUIRED');
});

process.on('exit', () => {
  Subscription.findOne = originalFindOne;
});
