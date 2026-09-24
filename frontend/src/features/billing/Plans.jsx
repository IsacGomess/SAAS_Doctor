import React, { useEffect, useState } from 'react';
import {
  createCheckout,
  getSubscription,
  openPortal
} from '../../services/billing';

const PLAN_DEFS = {
  professional: {
    eyebrow: 'Para atendimento individual',
    title: 'MED1PE Profissional',
    price: '59,90',
    desc: 'Tudo o que você precisa para organizar sua rotina, seus pacientes e seus atendimentos em um único lugar.',
    benefits: [
      {
        title: 'Prontuário eletrônico',
        desc: 'Histórico clínico organizado e acessível durante os atendimentos.'
      },
      {
        title: 'Gestão de pacientes',
        desc: 'Centralize informações importantes sem depender de controles separados.'
      },
      {
        title: 'Agenda de atendimentos',
        desc: 'Visualize sua rotina de forma simples e organizada.'
      },
      {
        title: 'Convênios',
        desc: 'Mantenha as informações dos convênios vinculadas aos pacientes.'
      },
      {
        title: 'Histórico clínico',
        desc: 'Acompanhe a evolução dos pacientes ao longo do tratamento.'
      },
      {
        title: 'Ambiente individual',
        desc: 'Uma estrutura pensada para o profissional que atende por conta própria.'
      }
    ],
    cta: 'Escolher Profissional',
    icon: 'bi-person-badge'
  },

  clinic: {
    eyebrow: 'Para clínicas e equipes',
    title: 'MED1PE Clínica',
    price: '199,90',
    desc: 'Centralize profissionais, pacientes e a operação da clínica em uma única estrutura de gestão.',
    benefits: [
      {
        title: 'Tudo do plano Profissional',
        desc: 'Prontuário, pacientes, agenda, convênios e histórico clínico.'
      },
      {
        title: 'Gestão de equipe',
        desc: 'Organize os profissionais vinculados à clínica.'
      },
      {
        title: 'Múltiplos profissionais',
        desc: 'Uma estrutura preparada para o trabalho em equipe.'
      },
      {
        title: 'Relatórios da clínica',
        desc: 'Tenha uma visão mais clara da operação e dos atendimentos.'
      },
      {
        title: 'Fila de espera',
        desc: 'Organize pacientes que aguardam disponibilidade de atendimento.'
      },
      {
        title: 'Gestão centralizada',
        desc: 'Reúna informações importantes da clínica em um único ambiente.'
      }
    ],
    cta: 'Escolher Clínica',
    icon: 'bi-hospital',
    featured: true
  }
};

const STATUS_MAP = {
  active: {
    label: 'Ativo',
    className: 'bg-success-subtle text-success border border-success-subtle'
  },
  trialing: {
    label: 'Período gratuito',
    className: 'bg-info-subtle text-info-emphasis border border-info-subtle'
  },
  past_due: {
    label: 'Pagamento pendente',
    className: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
  },
  canceled: {
    label: 'Cancelado',
    className: 'bg-secondary-subtle text-secondary border'
  }
};

export default function Plans() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [trialEligible, setTrialEligible] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadSubscription = async () => {
      try {
        const res = await getSubscription();

        if (!mounted) return;

        setSubscription(res?.subscription || null);
        setTrialEligible(Boolean(res?.trialEligible));
      } catch (err) {
        console.error('Erro ao carregar assinatura', err);

        if (mounted) {
          setError(
            err?.response?.data?.message ||
            'Não foi possível carregar suas informações de assinatura.'
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSubscription();

    return () => {
      mounted = false;
    };
  }, []);

  const handleCheckout = async (plan) => {
    setError(null);
    setActionLoading(plan);

    try {
      const res = await createCheckout(plan);

      if (res?.url) {
        window.location.href = res.url;
        return;
      }

      setError(res?.message || 'Não foi possível iniciar o pagamento.');
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
        'Não foi possível iniciar o pagamento.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handlePortal = async () => {
    setError(null);
    setActionLoading('portal');

    try {
      const res = await openPortal();

      if (res?.url) {
        window.location.href = res.url;
        return;
      }

      setError(
        res?.message ||
        'Não foi possível abrir o gerenciamento da assinatura.'
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
        'Não foi possível abrir o gerenciamento da assinatura.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const renderBadge = (sub) => {
    if (!sub) return null;

    const status = STATUS_MAP[sub.status] || {
      label: sub.status,
      className: 'bg-secondary-subtle text-secondary border'
    };

    return (
      <span
        className={`badge rounded-pill px-3 py-2 ${status.className}`}
      >
        <i className="bi bi-circle-fill me-2" style={{ fontSize: '0.45rem' }} />
        {status.label}
      </span>
    );
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return null;

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString('pt-BR');
  };

  const hasScheduledCancellation = Boolean(
    subscription?.cancelAtPeriodEnd || subscription?.cancelAt
  );

  const accessUntilDate = subscription?.cancelAt || subscription?.currentPeriodEnd;

  if (loading) {
    return (
      <div
        className="container d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: '70vh' }}
      >
        <div
          className="spinner-border text-primary mb-3"
          role="status"
        >
          <span className="visually-hidden">Carregando...</span>
        </div>

        <span className="text-muted">
          Carregando seus planos...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-body-tertiary min-vh-100">
      <div className="container py-5">

        <div className="mb-4">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => window.location.assign('/dashboard')}
          >
            <i className="bi bi-arrow-left me-2" />
            Voltar ao dashboard
          </button>
        </div>

        {/* HERO */}
        <div className="text-center mx-auto mb-5" style={{ maxWidth: '760px' }}>
          <span className="badge rounded-pill bg-primary-subtle text-primary px-3 py-2 mb-3">
            <i className="bi bi-stars me-2" />
            Planos MED1PE
          </span>

          <h1 className="display-6 fw-bold mb-3">
            Mais organização para sua rotina.
            <br />
            <span className="text-primary">
              Mais tempo para seus pacientes.
            </span>
          </h1>

          <p className="lead text-secondary mb-0">
            Escolha a estrutura ideal para organizar atendimentos,
            pacientes e informações clínicas em um único ambiente.
          </p>
        </div>

        {/* PLANO ATUAL */}
        {subscription && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="row align-items-center g-3">

                <div className="col-md">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center"
                      style={{ width: 48, height: 48 }}
                    >
                      <i className="bi bi-credit-card fs-4" />
                    </div>

                    <div>
                      <small className="text-muted d-block">
                        Sua assinatura
                      </small>

                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <h5 className="mb-0 fw-bold">
                          {PLAN_DEFS[subscription.plan]?.title ||
                            subscription.plan}
                        </h5>

                        {renderBadge(subscription)}
                      </div>

                      {subscription.status === 'trialing' && (
                        <div className="text-info d-block mt-1">
                          <small className="d-block fw-semibold">
                            <i className="bi bi-sparkles me-1" />
                            Período gratuito
                          </small>
                          <small className="d-block">
                            7 dias grátis
                          </small>
                          {(subscription.trialEndsAt || subscription.currentPeriodEnd) && (
                            <small className="d-block">
                              Acesso gratuito até <strong>{formatDate(subscription.trialEndsAt || subscription.currentPeriodEnd)}</strong>
                            </small>
                          )}
                        </div>
                      )}

                      {subscription.currentPeriodEnd &&
                        !hasScheduledCancellation &&
                        subscription.status !== 'trialing' && (
                          <small className="text-muted">
                            Próxima renovação em{' '}
                            <strong>
                              {formatDate(subscription.currentPeriodEnd)}
                            </strong>
                          </small>
                        )}

                      {hasScheduledCancellation && (
                        <div className="text-danger d-block mt-1">
                          <small className="d-block fw-semibold">
                            <i className="bi bi-info-circle me-1" />
                            Renovação cancelada
                          </small>
                          {accessUntilDate && (
                            <small className="d-block">
                              Acesso até <strong>{formatDate(accessUntilDate)}</strong>
                            </small>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-md-auto">
                  <button
                    className="btn btn-outline-primary"
                    onClick={handlePortal}
                    disabled={actionLoading === 'portal'}
                  >
                    {actionLoading === 'portal' ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Abrindo...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-gear me-2" />
                        Gerenciar assinatura
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ERRO */}
        {error && (
          <div
            className="alert alert-danger border-0 shadow-sm d-flex align-items-center"
            role="alert"
          >
            <i className="bi bi-exclamation-circle-fill fs-5 me-3" />
            <div>{error}</div>
          </div>
        )}

        {/* CARDS */}
        <div className="row g-4 justify-content-center">

          {Object.entries(PLAN_DEFS).map(([key, plan]) => {
            const isCurrent =
              subscription && subscription.plan === key;

            return (
              <div
                className="col-12 col-lg-6"
                key={key}
              >
                <div
                  className={`card h-100 border-0 position-relative ${
                    plan.featured
                      ? 'shadow-lg'
                      : 'shadow-sm'
                  }`}
                  style={{
                    borderRadius: '20px',
                    overflow: 'hidden'
                  }}
                >

                  {/* DESTAQUE CLÍNICA */}
                  {plan.featured && (
                    <div className="bg-primary text-white text-center py-2 fw-semibold small">
                      <i className="bi bi-building-check me-2" />
                      Ideal para clínicas e equipes
                    </div>
                  )}

                  <div className="card-body p-4 p-xl-5 d-flex flex-column">

                    {/* CABEÇALHO */}
                    <div className="mb-4">

                      <div
                        className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center mb-3"
                        style={{ width: 52, height: 52 }}
                      >
                        <i className={`bi ${plan.icon} fs-4`} />
                      </div>

                      <small className="text-primary fw-semibold text-uppercase">
                        {plan.eyebrow}
                      </small>

                      <h2 className="h3 fw-bold mt-1 mb-3">
                        {plan.title}
                      </h2>

                      <p className="text-secondary mb-4">
                        {plan.desc}
                      </p>

                      <div className="d-flex align-items-end gap-1">
                        <span className="text-muted mb-2">
                          R$
                        </span>

                        <span
                          className="fw-bold lh-1"
                          style={{ fontSize: '2.7rem' }}
                        >
                          {plan.price.replace('R$ ', '').replace('/mês', '')}
                        </span>

                        <span className="text-muted mb-1">
                          /mês
                        </span>
                      </div>

                      <small className="text-muted">
                        Assinatura mensal
                      </small>

                      {(trialEligible && !subscription) && (
                        <div className="mt-2 text-primary fw-semibold small">
                          <i className="bi bi-sparkles me-1" />
                          7 dias grátis
                        </div>
                      )}
                    </div>

                    <hr className="text-secondary opacity-25" />

                    {/* BENEFÍCIOS */}
                    <div className="my-3 flex-grow-1">

                      <p className="fw-semibold mb-3">
                        O que está incluído:
                      </p>

                      <div className="d-flex flex-column gap-3">

                        {plan.benefits.map((benefit, index) => (
                          <div
                            className="d-flex align-items-start gap-3"
                            key={index}
                          >
                            <div
                              className="bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                              style={{
                                width: 24,
                                height: 24
                              }}
                            >
                              <i
                                className="bi bi-check-lg"
                                style={{ fontSize: '0.85rem' }}
                              />
                            </div>

                            <div>
                              <div className="fw-semibold">
                                {benefit.title}
                              </div>

                              <small className="text-muted">
                                {benefit.desc}
                              </small>
                            </div>
                          </div>
                        ))}

                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-4">

                      {isCurrent ? (
                        <>
                          <button
                            className="btn btn-success w-100 py-3 fw-semibold"
                            disabled
                          >
                            <i className="bi bi-check-circle-fill me-2" />
                            Seu plano atual
                          </button>

                          <small className="text-muted d-block text-center mt-2">
                            Esta assinatura já está vinculada à sua conta.
                          </small>
                        </>
                      ) : (
                        <>
                          <button
                            className={`btn ${
                              plan.featured
                                ? 'btn-primary'
                                : 'btn-outline-primary'
                            } w-100 py-3 fw-semibold`}
                            onClick={() => handleCheckout(key)}
                            disabled={Boolean(actionLoading)}
                          >
                            {actionLoading === key ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                />
                                Preparando pagamento...
                              </>
                            ) : (
                              <>
                                {plan.cta}
                                <i className="bi bi-arrow-right ms-2" />
                              </>
                            )}
                          </button>

                          <small className="text-muted d-block text-center mt-2">
                            {trialEligible && !subscription
                              ? '7 dias grátis. Após o período, a assinatura passa a ser cobrada mensalmente, salvo cancelamento antes do término.'
                              : 'Você será direcionado para o checkout seguro.'}
                          </small>
                        </>
                      )}

                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* TRUST BAR */}
        <div className="card border-0 shadow-sm mt-5">
          <div className="card-body py-4">
            <div className="row g-4 text-center">

              <div className="col-12 col-md-4">
                <i className="bi bi-shield-check text-success fs-3 d-block mb-2" />

                <strong className="d-block">
                  Pagamento seguro
                </strong>

                <small className="text-muted">
                  Pagamento processado pela Stripe.
                </small>
              </div>

              <div className="col-12 col-md-4">
                <i className="bi bi-calendar-check text-primary fs-3 d-block mb-2" />

                <strong className="d-block">
                  Assinatura mensal
                </strong>

                <small className="text-muted">
                  Acompanhe sua assinatura diretamente pelo MED1PE.
                </small>
              </div>

              <div className="col-12 col-md-4">
                <i className="bi bi-credit-card-2-front text-primary fs-3 d-block mb-2" />

                <strong className="d-block">
                  Cobrança gerenciada
                </strong>

                <small className="text-muted">
                  Gerencie sua assinatura pelo portal de cobrança.
                </small>
              </div>

            </div>
          </div>
        </div>

        {/* COPY FINAL */}
        <div
          className="text-center mx-auto py-5"
          style={{ maxWidth: 720 }}
        >
          <h3 className="fw-bold mb-3">
            Menos tempo organizando.
            <br />
            Mais tempo cuidando.
          </h3>

          <p className="text-secondary mb-0">
            O MED1PE reúne as principais ferramentas da rotina clínica
            para que você mantenha pacientes, atendimentos e informações
            importantes organizados em um único ambiente.
          </p>
        </div>

      </div>
    </div>
  );
}