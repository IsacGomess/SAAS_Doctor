const mongoose = require('mongoose');

const processedWebhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, index: true, unique: true },
  stripeSubscriptionId: { type: String, default: null },
  ownerType: { type: String, default: null },
  ownerId: { type: String, default: null },
  status: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'failed'],
    default: 'pending'
  },
  processedAt: { type: Date, default: null },
  startedAt: { type: Date, default: null },
  processingLeaseExpiresAt: { type: Date, default: null },
  finishedAt: { type: Date, default: null },
  errorMessage: { type: String, default: null },
  eventCreatedAt: { type: Date, default: null }
}, { timestamps: true });

const ProcessedWebhookEvent = mongoose.model('ProcessedWebhookEvent', processedWebhookEventSchema, 'processed_webhook_events');

module.exports = ProcessedWebhookEvent;
