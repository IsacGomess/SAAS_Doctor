import { useState } from "react";
import { Outlet } from "react-router-dom"; 
import { NavBar } from "../pages-components/nav-bar";
import { SelectorsDashboard } from "../pages-components/selectors-dashboard";

function Dashboard() {
    const [username, setUserName] = useState(localStorage.getItem("userName") || ""); 

    return (
        // vh-100 força o container pai a ocupar exatamente a altura da tela inteira
        <div className="vh-100 d-flex flex-column pt-5 ps-1 w-100" style={{ backgroundColor: '#F0F4F3', minHeight: '100vh' }}>
            
            {/* 1. Barra superior do topo */}
            <NavBar userName={username} />
            
            {/* 2. Área principal (Menu Lateral + Conteúdo da Direita) */}
            <div className="d-flex flex-grow-1 ps-3 m-0" style={{ minHeight: 0 }}>
                
                {/* Abaixo, envolvemos o seu menu lateral em uma div flexível que 
                  garante que ele ocupe seu próprio espaço e empurre o resto para a direita
                */}
                <aside className="bg-white border-end h-100 p-0 m-0" style={{ width: "210px", minWidth: "210px" }}>
                    <SelectorsDashboard />
                </aside>
                
                {/* Área do conteúdo (Onde o Outlet joga os Cards).
                  O overflowY: 'auto' garante que se a tela for pequena, apareça uma barra de rolagem 
                  APENAS nos cards, mantendo a navbar e o menu lateral sempre fixos na tela!
                */}
                <main className="flex-grow-1 p-4" style={{ backgroundColor: '#F0F4F3', overflowY: 'auto' }}>
                    <Outlet /> 
                </main>

            </div>
        </div>   
    );
}    

export default Dashboard;