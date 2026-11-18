const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');

const loadModels = `
  const { stripeLiveMode } = require('./src/modules/billing/stripe-mode');
  const Subscription = require('./src/modules/billing/subscription.model');
  const ProcessedWebhookEvent = require('./src/modules/billing/processed-webhook-event.model');
  process.stdout.write(JSON.stringify([
    stripeLiveMode,
    Subscription.collection.collectionName,
    ProcessedWebhookEvent.collection.collectionName
  ]));
`;

test('a chave Stripe separa assinaturas e webhooks, mesmo com NODE_ENV production', () => {
  for (const [keyType, mode] of [['sk', 'test'], ['rk', 'test'], ['sk', 'live'], ['rk', 'live']]) {
    const output = execFileSync(process.execPath, ['-e', loadModels], {
      cwd: resolve(__dirname, '..'),
      env: { NODE_ENV: 'production', STRIPE_SECRET_KEY: `${keyType}_${mode}_fixture` },
      encoding: 'utf8'
    });
    const live = mode === 'live';
    assert.deepEqual(JSON.parse(output), live
      ? [true, 'subscriptions_live', 'processed_webhook_events_live']
      : [false, 'subscriptions', 'processed_webhook_events']);
  }
});
