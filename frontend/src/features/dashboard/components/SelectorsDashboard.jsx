import React from "react";
import { NavLink } from "react-router-dom";
import { getSubscription } from "../../../services/billing";

export function SelectorsDashboard() {
    const role = localStorage.getItem('role') || '';
    const [resolvedRole, setResolvedRole] = (typeof window !== 'undefined') ? [role, null] : [role, null];
    const [subscriptionPlan, setSubscriptionPlan] = React.useState(null);

    // If role is not in localStorage, attempt to fetch current user
    React.useEffect(() => {
        if (!role) {
            (async () => {
                try {
                    const res = await fetch('/api/users/me', { credentials: 'include' });
                    if (res.ok) {
                        const json = await res.json();
                        const r = json.user?.role;
                        if (r) {
                            localStorage.setItem('role', r);
                            window.location.reload();
                        }
                    }
                } catch (err) {
                    // ignore
                }
            })();
        }
    }, []);

    React.useEffect(() => {
        let active = true;

        const loadPlan = async () => {
            try {
                const res = await getSubscription();
                if (!active) return;
                setSubscriptionPlan(res?.subscription?.plan || null);
            } catch {
                if (!active) return;
                setSubscriptionPlan(null);
            }
        };

        loadPlan();

        return () => {
            active = false;
        };
    }, []);

    const clinicMenuLabel = subscriptionPlan === 'professional'
        ? 'Meus dados'
        : 'Minha Clínica';

    const menuItems = [
        { to: "/dashboard", label: "Dashboard", icon: "bi-house-door", end: true },
        { to: "patients", label: "Pacientes", icon: "bi-people" },
        { to: "clinic-schedule", label: "Agenda", icon: "bi-calendar2-plus" },
        { to: "/dashboard/clinica", label: clinicMenuLabel, icon: "bi-building" },
        { to: "/planos", label: "Assinatura MED1", icon: "bi-credit-card" },
        { to: "waiting-line", label: "Status", icon: "bi-hourglass-split" },
        // Relatórios visíveis apenas para administradores
        ...(role === 'administrador' ? [{ to: "reports", label: "Relatórios", icon: "bi-bar-chart-line" }] : []),
    ];

    return (
        <>
            <div
                className="icone mt-3 d-flex justify-content-center align-items-center"
                style={{ backgroundColor: "#FFFFFF" }}
            >
                <i className="bi bi-lungs me-2"></i>
                <p className="med mb-0 sidebar-brand-text">MED</p>
            </div>

            <div className="position-btn bg-white d-flex flex-column align-items-center">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        title={item.label}
                        className={({ isActive }) =>
                            `btn btn-color-defaut m-1 fs-5 d-flex align-items-center w-100 ${isActive ? "activo" : ""}`
                        }
                    >
                        <i className={`bi ${item.icon} icon-menu me-4`}></i>
                        <span className="sidebar-label">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </>
    );
}