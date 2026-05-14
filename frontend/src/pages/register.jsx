import { useState } from "react";
import api from "../services/api";
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
            const response = await api.post('/api/users/register', { name, email, password, crm });

            if(response.data.token){
                localStorage.setItem('token', response.data.token);
            }
            alert("Médico registrado com sucesso!!");
            navigate("/login"); // Redireciona para a página de login após o registro bem-sucedido
        } catch (error) {
            const mensagem = error.response?.data?.message || "Erro no servidor";
            console.error("Erro completo:", error.response?.data); 
            alert("Erro ao registrar médico: " + mensagem);
           }
    };

    return ( 
        <div className="login-page-wrapper">
      <div className="login-card-container" style={{ minHeight: "700px" }}>
        
        {/* LADO ESQUERDO: INSTITUCIONAL (Reutilizando o estilo do Login) */}
        <div className="left-panel">
          <div>
            <h1 className="fw-bold display-5">Médico <br/>Assistente</h1>
            <p className="fs-5 mt-3 opacity-75">Junte-se à nossa rede de profissionais e modernize sua gestão de tempo.</p>
          </div>
          
          <div className="benefits">
            <div className="mb-4">
              <strong>🏥 Prontuário Digital</strong>
              <p className="small opacity-75 mb-0">Acesse o histórico de seus pacientes de qualquer lugar.</p>
            </div>
            <div>
              <strong>⚡ Agilidade no Diagnóstico</strong>
              <p className="small opacity-75 mb-0">Ferramentas inteligentes para o dia a dia clínico.</p>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: FORMULÁRIO DE REGISTRO */}
        <div className="right-panel">
          <div className="mb-4 text-center">
            <h2 className="fw-bold">Crie sua conta</h2>
            <p className="text-muted">Preencha seus dados profissionais</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-1"><small className="fw-bold text-secondary">Nome Completo</small></div>
            <div className="custom-input-group">
              <span>👤</span>
              <input type="text" placeholder="Dr(a). Nome Sobrenome" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="mb-1"><small className="fw-bold text-secondary">E-mail</small></div>
            <div className="custom-input-group">
              <span>📧</span>
              <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="row">
                <div className="col-md-6">
                    <div className="mb-1"><small className="fw-bold text-secondary">Senha</small></div>
                    <div className="custom-input-group">
                      <span>🔒</span>
                      <input type="password" placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="mb-1"><small className="fw-bold text-secondary">CRM</small></div>
                    <div className="custom-input-group">
                      <span>🆔</span>
                      <input type="text" placeholder="000000-UF" value={crm} onChange={(e) => setCrm(e.target.value)} required />
                    </div>
                </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-3 fw-bold shadow-sm mb-4" style={{borderRadius: '10px'}}>
              Finalizar Cadastro
            </button>

            <div className="text-center">
              <span className="text-muted small">Já tem conta? </span>
              <button 
                type="button"
                onClick={() => navigate("/login")} 
                className="btn btn-link p-0 fw-bold text-decoration-none"
              >
                Faça login
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
    );
}

export default Register;
