import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { confirmCheckout, getSubscription } from '../../services/billing';

const CHECK_INTERVAL_MS = 2000;
const MAX_CHECKS = 8;

export default function CheckoutConfirmation() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let timer;

    const checkSubscription = async (remaining) => {
      try {
        const shouldConfirmWithStripe = remaining === MAX_CHECKS || remaining === MAX_CHECKS / 2;
        const verify = shouldConfirmWithStripe ? confirmCheckout : getSubscription;
        const result = await verify({ signal: controller.signal, timeout: 6000 });
        if (controller.signal.aborted) return;
        if (result?.hasActiveSubscription) {
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch {
        if (controller.signal.aborted) return;
      }

      if (remaining > 1) {
        timer = window.setTimeout(() => checkSubscription(remaining - 1), CHECK_INTERVAL_MS);
      } else {
        setChecking(false);
      }
    };

    timer = window.setTimeout(() => checkSubscription(MAX_CHECKS), 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [navigate, retry]);

  return (
    <section className="alert alert-light border my-3" aria-labelledby="checkout-confirmation-title">
      <h1 id="checkout-confirmation-title" className="h6">
        {checking ? 'Confirmando sua assinatura' : 'Aguardando confirmação da Stripe'}
      </h1>
      {checking ? (
        <p className="text-secondary mb-0" role="status">Aguardando a confirmação da Stripe para carregar seus dados.</p>
      ) : (
        <>
          <button
            className="btn btn-primary me-2"
            type="button"
            onClick={() => {
              setChecking(true);
              setRetry((value) => value + 1);
            }}
          >
            Verificar novamente
          </button>
          <Link to="/planos" className="btn btn-outline-secondary">Voltar aos planos</Link>
        </>
      )}
    </section>
  );
}
