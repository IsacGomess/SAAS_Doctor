
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Importa o hook useNavigate

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // Inicializa o hook useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { 
        const response = await axios.post("http:localhost:5000/api/users/login", { email, password });
        alert("Sucesso, Bem vindo !!");
    } catch (error) {
        alert("Erro ao logar:", error.response ? error.response.data : error.message);
    }  
    };
    return (
        <div className="container d-flex justyfy-content-center align-items-center vh-100">
            <div className="card p4 shadow"  style={{width: '400px'}}>  
                <h2>Bem vindo ao pronturario Medico Assistente</h2>
                <h3>Acesse sua conta ou registre-se</h3>

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Senha</label>
                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit"  className="btn btn-primary w-100">Entrar</button>
            </form>
                <p className="mt-3"> Não tem Conta ? <button onClick={() => navigate("/register")} className="btn btn-link">Registre-se</button></p>    
            </div>
        </div>
    );
} 

export default Login;