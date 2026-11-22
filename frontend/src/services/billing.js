import api from './api';

export async function createCheckout(plan) {
  const res = await api.post('/api/billing/checkout', { plan });
  return res.data;
}

export async function getSubscription(config) {
  const res = await api.get('/api/billing/subscription', config);
  return res.data;
}

export async function confirmCheckout(config) {
  const res = await api.post('/api/billing/checkout/confirm', {}, config);
  return res.data;
}

export async function openPortal() {
  const res = await api.post('/api/billing/portal');
  return res.data;
}
