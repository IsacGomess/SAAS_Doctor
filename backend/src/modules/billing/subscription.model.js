const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  ownerType: { type: String, enum: ['user', 'clinic'], required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  plan: { type: String, enum: ['professional', 'clinic'], required: true },
  status: { type: String, default: 'pending' },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  stripePriceId: { type: String, default: null },
  currentPeriodEnd: { type: Date, default: null },
  cancelAt: { type: Date, default: null },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  trialUsed: { type: Boolean, default: false },
  trialStartedAt: { type: Date, default: null },
  trialEndsAt: { type: Date, default: null },
  lastWebhookEventId: { type: String, default: null },
  lastWebhookProcessedAt: { type: Date, default: null },
  processedWebhookEventIds: { type: [String], default: [] }
}, { timestamps: true });

// prevent duplicate subscription records per owner
subscriptionSchema.index({ ownerType: 1, ownerId: 1 }, { unique: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema, 'subscriptions');

module.exports = Subscription;
