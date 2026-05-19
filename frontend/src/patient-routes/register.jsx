import api from "../services/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Importa o hook useNavigate

 export const registerPatients = async () => {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [cpf, setCpf] = useState("");
    const [phone, setPhone] = useState("");
    const [observations, setObservations] = useState("");
    const [isPresent, setIsPresent] = useState(false);
    const [username, setUserName] = useState(localStorage.getItem("userName") || ""); // Obtém o nome do usuário do localStorage    
    
        try {
            const response = await api.post('/api/users/patients/register-patient',{name, cpf, phone, observations, isPresent});
            
            
            alert("Paciente registrado com sucesso!");


        } catch (error) {


            alert("Erro ao registrar paciente!");
        }
    

    }