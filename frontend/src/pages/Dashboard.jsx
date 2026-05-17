import { useState ,useEffect} from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom"; // Importa o hook useNavigate
import {NavBar} from "../pages-components/nav-bar";
import {SelectorsDashboard} from "../pages-components/selectors-dashboard";
import {CardsDashboard} from "../pages-components/cards-dashboard";


function Dashboard() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [cpf, setCpf] = useState("");
    const [phone, setPhone] = useState("");
    const [observations, setObservations] = useState("");
    const [isPresent, setIsPresent] = useState(false);
    const [username, setUserName] = useState(localStorage.getItem("userName") || ""); // Obtém o nome do usuário do localStorage    
    

    const registerPatients = async () => {
        try {
            const response = await api.post('/api/users/patients/register-patient',{name, cpf, phone, observations, isPresent});
            
            
            alert("Paciente registrado com sucesso!");


        } catch (error) {


            alert("Erro ao registrar paciente!");
        }
    

    }

    return (
        <>
         <NavBar userName={username} />
            <SelectorsDashboard/>
            <CardsDashboard/>   
        </>   
    );
}    

export default Dashboard;