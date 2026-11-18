const stripeLiveMode = /^(?:sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY ?? '');

function billingCollectionName(baseName) {
  return stripeLiveMode ? `${baseName}_live` : baseName;
}

module.exports = { stripeLiveMode, billingCollectionName };
