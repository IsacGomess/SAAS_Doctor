const Subscription = require('../modules/billing/subscription.model');

const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing'];

function resolveOwnerFromRequest(req) {
  if (req && req.clinicaId) {
    return {
      ownerType: 'clinic',
      ownerId: req.clinicaId
    };
  }

  return {
    ownerType: 'user',
    ownerId: req?.userId || null
  };
}

async function requireActiveSubscription(req, res, next) {
  try {
    const { ownerType, ownerId } = resolveOwnerFromRequest(req);

    if (!ownerId) {
      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'É necessária uma assinatura ativa para utilizar este recurso.'
      });
    }

    const foundSubscription = await Subscription.findOne({
      ownerType,
      ownerId,
      status: { $in: ACTIVE_SUBSCRIPTION_STATUSES }
    });

    let subscription = foundSubscription && typeof foundSubscription.lean === 'function'
      ? foundSubscription.lean()
      : foundSubscription;

    // Usuários com clínica associada podem estar em plano Professional (ownerType=user).
    // Nesse caso, se não houver assinatura ativa da clínica, fazemos fallback para assinatura do usuário.
    if (!subscription && req?.userId && ownerType === 'clinic') {
      const userLevelSubscription = await Subscription.findOne({
        ownerType: 'user',
        ownerId: req.userId,
        status: { $in: ACTIVE_SUBSCRIPTION_STATUSES }
      });

      subscription = userLevelSubscription && typeof userLevelSubscription.lean === 'function'
        ? userLevelSubscription.lean()
        : userLevelSubscription;
    }

    if (!subscription || !ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'É necessária uma assinatura ativa para utilizar este recurso.'
      });
    }

    req.subscription = subscription;
    return next();
  } catch (error) {
    console.error('[requireActiveSubscription] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

module.exports = requireActiveSubscription;
module.exports.resolveOwnerFromRequest = resolveOwnerFromRequest;
module.exports.ACTIVE_SUBSCRIPTION_STATUSES = ACTIVE_SUBSCRIPTION_STATUSES;
