import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Importa o hook useNavigate

function Register() {
    const [name,setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [crm, setCrm] = useState("");
    const navigate = useNavigate(); // Inicializa o hook useNavigate

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:5000/api/users/register", { name, email, password, crm });
            alert("Médico registrado com sucesso!!");
            navigate("/login"); // Redireciona para a página de login após o registro bem-sucedido
        } catch (error) {
            alert("Erro ao registrar médico:", error.response ? error.response.data || "Erro desconhecido" : "Erro desconhecido" );
        }
    };

    return ( 
        <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="card-body p-5">
                <h1>Crie sua conta </h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="CRM"
                        value={crm}
                        onChange={(e) => setCrm(e.target.value)}
                        required
                    />
                    <button type="submit">Registrar</button>
                </form>
                <p> ja tem Conta ? <button onClick={() => navigate("/login")}>Faça login</button></p>
            </div>
        </div>
    );
}

export default Register;
