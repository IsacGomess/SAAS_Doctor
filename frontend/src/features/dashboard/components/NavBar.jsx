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
        <nav className="navbar"
            style={{ backgroundColor: '#F0F4F3', minHeight: '30px', position:'fixed', top:'0',left:'20%',width:'80%', borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
            <div className="container-fluid" style={{display:"flex", justifyContent:'space-between'}}>
                <span style={{fontSize:'18px',margin:'10px 0px 0px 10px'}}>
                    <p style={{fontSize:'14px' ,margin:'6px 0px 3px 5px'}}>{formatClinicName(clinicName) || 'Bem vindo,'}</p>
                    Dr<span style={{fontSize:'5px'}}>(a).</span>  {(userName || '').toUpperCase()} - {registroProf}
                    {renderSubscriptionIndicator()}
                </span>
                <button
                    className="btn btn-outline-dark btn-sm bg-white text-dark rounded-3 "
                    onClick={() => {
                        logout();
                    }}>
                      <i className="bi bi-arrow-bar-right"></i>Sair
                </button>
            </div>
        </nav>
    );
}
