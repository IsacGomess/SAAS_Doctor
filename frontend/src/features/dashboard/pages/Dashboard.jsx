import { useEffect, useState } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import { NavBar } from "../components/NavBar";
import { SelectorsDashboard } from "../components/SelectorsDashboard";
import CheckoutConfirmation from "../../billing/CheckoutConfirmation";
import "./Dashboard.css";

function Dashboard() {
    const [searchParams] = useSearchParams();
    const confirmingCheckout = searchParams.get('billing') === 'success';
    const [username, setUserName] = useState(localStorage.getItem("userName") || ""); 
    const [registroProf, setRegistroProf] = useState(localStorage.getItem("registroProf") || "");
    const [clinicName, setClinicName] = useState(localStorage.getItem("clinicName") || "");

    useEffect(() => {
        const syncProfileHeader = () => {
            setUserName(localStorage.getItem("userName") || "");
            setRegistroProf(localStorage.getItem("registroProf") || "");
            setClinicName(localStorage.getItem("clinicName") || "");
        };

        const handleStorage = () => syncProfileHeader();
        const handleProfileUpdated = () => syncProfileHeader();

        window.addEventListener('storage', handleStorage);
        window.addEventListener('user-profile-updated', handleProfileUpdated);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('user-profile-updated', handleProfileUpdated);
        };
    }, []);

    return (
        <div className="med1pe-dashboard-shell">
            <NavBar userName={username} registroProf={registroProf} clinicName={clinicName} confirmingCheckout={confirmingCheckout} />

            <div className="med1pe-dashboard-layout">
                <aside className="dashboard-sidebar" aria-label="Menu lateral do dashboard">
                    <SelectorsDashboard confirmingCheckout={confirmingCheckout} />
                </aside>

                <main className="dashboard-main">
                    {confirmingCheckout ? <CheckoutConfirmation /> : <Outlet />}
                </main>
            </div>
        </div>
    );
}

export default Dashboard;
