import { useState } from "react";
import { Outlet } from "react-router-dom"; 
import { NavBar } from "../components/NavBar";
import { SelectorsDashboard } from "../components/SelectorsDashboard";

function Dashboard() {
    const [username, setUserName] = useState(localStorage.getItem("userName") || ""); 
    const [registroProf, setRegistroProf] = useState(localStorage.getItem("registroProf") || "");

    return (
        // vh-100 força o container pai a ocupar exatamente a altura da tela inteira
        <>
            <style>{`
                @media (max-width: 767px) {
                    .dashboard-sidebar {
                        width: 72px !important;
                        min-width: 72px !important;
                    }
                    .dashboard-sidebar .sidebar-brand-text,
                    .dashboard-sidebar .sidebar-label {
                        display: none !important;
                    }
                    .dashboard-sidebar .nav-link {
                        justify-content: center !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                    .dashboard-sidebar .icon-menu {
                        margin-right: 0 !important;
                    }
                }
            `}</style>

            <div className="vh-100 d-flex flex-column pt-5 ps-1 w-100" style={{ backgroundColor: '#F0F4F3', minHeight: '100vh' }}>
                {/* 1. Barra superior do topo */}
                <NavBar userName={username} registroProf={registroProf} />

                {/* 2. Área principal (Menu Lateral + Conteúdo da Direita) */}
                <div className="d-flex flex-grow-1 ps-3 m-0" style={{ minHeight: 0 }}>
                    <aside className="dashboard-sidebar bg-white border-end h-100 p-0 m-0" style={{ width: "210px", minWidth: "210px" }}>
                        <SelectorsDashboard />
                    </aside>

                    <main className="flex-grow-1 p-4" style={{ backgroundColor: '#F0F4F3', overflowY: 'auto' }}>
                        <Outlet />
                    </main>
                </div>
            </div>
        </>
    );
}

export default Dashboard;