import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { getSubscription } from "../../../services/billing";

export function NavBar({userName, registroProf, clinicName}) {
    const { logout } = useAuth();
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);

    const formatClinicName = (name) => {
        if (!name) return '';

        return name
            .trim()
            .replace(/\s+/g, ' ')
            .split(' ')
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    useEffect(() => {
        let active = true;

        const loadSubscriptionStatus = async () => {
            try {
                const res = await getSubscription();
                if (!active) return;
                setSubscriptionStatus(res?.subscription?.status || null);
            } catch (error) {
                if (!active) return;
                setSubscriptionStatus(null);
            }
        };

        loadSubscriptionStatus();

        return () => {
            active = false;
        };
    }, []);

    const renderSubscriptionIndicator = () => {
        if (!subscriptionStatus) return null;

        if (subscriptionStatus === 'active') {
            return (
                <i
                    className="bi bi-patch-check-fill text-success ms-2"
                    title="Assinatura MED1PE ativa"
                    aria-label="Assinatura MED1PE ativa"
                    style={{ fontSize: '1rem' }}
                />
            );
        }

        if (subscriptionStatus === 'trialing') {
            return (
                <i
                    className="bi bi-check-circle-fill text-primary ms-2"
                    title="Período gratuito MED1PE ativo"
                    aria-label="Período gratuito MED1PE ativo"
                    style={{ fontSize: '1rem' }}
                />
            );
        }

        if (subscriptionStatus === 'past_due') {
            return (
                <i
                    className="bi bi-exclamation-diamond-fill text-warning ms-2"
                    title="Pagamento pendente"
                    aria-label="Pagamento pendente"
                    style={{ fontSize: '1rem' }}
                />
            );
        }

        return null;
    };

    return (
        <nav className="dashboard-topbar" role="navigation" aria-label="Cabeçalho do dashboard">
            <div className="dashboard-topbar-inner">
                <div className="dashboard-topbar-title">
                    <p className="dashboard-topbar-clinic">{formatClinicName(clinicName) || 'Bem vindo,'}</p>
                    <span className="dashboard-topbar-doctor">
                        Dr<span className="dashboard-topbar-suffix">(a).</span> {(userName || '').toUpperCase()} - {registroProf}
                        {renderSubscriptionIndicator()}
                    </span>
                </div>
                <button
                    className="btn btn-outline-dark btn-sm bg-white text-dark rounded-3 dashboard-logout-btn"
                    onClick={() => {
                        logout();
                    }}>
                      <i className="bi bi-arrow-bar-right"></i>Sair
                </button>
            </div>
        </nav>
    );
}
