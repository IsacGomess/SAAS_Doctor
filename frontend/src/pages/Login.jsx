
import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom"; // Importa o hook useNavigate

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // Inicializa o hook useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { 
        const response = await api.post('/api/users/login', { email, password });
        
        if(response.data.accessToken){
                localStorage.setItem('token', response.data.accessToken); // Armazena o token de acesso no localStorage
                localStorage.setItem('userName', response.data.user.name); // Armazena o nome do usuário no localStorage
            }
        alert("Sucesso, Bem vindo !!");
        navigate("/dashboard"); // Redireciona para a página de dashboard após o login bem-sucedido
    } catch (error) {
      
        alert("Erro ao logar:");
    }  
  };
    return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        
        {/* LADO ESQUERDO: INFOS */}
        <div className="left-panel">
          <div>
            <h1 className="fw-bold display-5">Médico <br/>Assistente</h1>
            <p className="fs-5 mt-3 opacity-75"></p>
          </div>
          
          <div className="benefits">
            <div className="mb-4">
              <strong>🛡️ Dados Protegidos</strong>
              <p className="small opacity-75 mb-0">Segurança total dos seus prontuários.</p>
            </div>
            <div>
              <strong>📅 Gestão de Consultas</strong>
              <p className="small opacity-75 mb-0">Gerencie seus Pacientes.</p>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: FORMULÁRIO */}
        <div className="right-panel">
          <div className="mb-5 text-center">
            <h2 className="fw-bold">Login</h2>
            <p className="text-muted">Acesse sua conta corporativa</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-2"><small className="fw-bold text-secondary">E-mail</small></div>
            <div className="custom-input-group">
              <span>📧</span>
              <input 
                type="email" 
                placeholder="seu@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>

            <div className="mb-2"><small className="fw-bold text-secondary">Senha</small></div>
            <div className="custom-input-group">
              <span>🔒</span>
              <input 
                type="password" 
                placeholder="Sua senha secreta" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-3 fw-bold shadow-sm mb-4" style={{borderRadius: '10px'}}>
              Entrar no Sistema
            </button>

            <div className="text-center">
              <span className="text-muted small">Não possui conta? </span>
              <button 
                type="button"
                onClick={() => navigate("/register")} 
                className="btn btn-link p-0 fw-bold text-decoration-none"
              >
                Crie uma agora
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
    );
} 

export default Login;