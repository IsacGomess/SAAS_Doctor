import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom"; // Importa o hook useNavigate
import {NavBar} from "../pages-components/nav-bar";


function Dashboard() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [cpf, setCpf] = useState("");
    const [phone, setPhone] = useState("");
    const [observations, setObservations] = useState("");
    const [isPresent, setIsPresent] = useState(false);

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
         <NavBar />
            
        </>   
    );
}    

export default Dashboard;