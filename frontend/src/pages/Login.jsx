
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
        const response = await api.post('/api/users/login', { email, password});
        
        if(response.data.accessToken){
                localStorage.setItem('token', response.data.accessToken); // Armazena o token de acesso no localStorage
                localStorage.setItem('userName', response.data.user.name); // Armazena o nome do usuário no localStorage
            }
        alert("Sucesso, Bem vindo !!");
        navigate("/dashboard"); // Redireciona para a página de dashboard após o login bem-sucedido
    } catch (error) {
      
        alert("Erro de usuario ou senha ao logar:");
    }  
  };
    return (
          <div className="login-page-wrapper">
            <div
                style={{
                width: '100%',
                display: 'flex',
                flexWrap: 'wrap',
                minHeight: '100vh'
              }}>
              
              {/* LADO ESQUERDO: INFOS (Painel Verde) */}
              <div  
                    style={{background: 'linear-gradient(135deg, #1E6B65 0%, #154D49 100%)',
                    flex:'1 1 450px', 
                    minWidth:'320px',
                    padding:'40px 20px',
                    padding:'60px',
                    display: "flex",
                    flexDirection: 'column',
                    justifyContent:'space-between',
                    minHeight: '100vh'}}>
                <div className="left-panel-content">
                  
                  {/* Logo */}
                  <div className="logo-area ">
                    <span className="fs-3 me-2"></span>
                    <span className="fw-bold tracking-wide h4 m-0" style={{color:"white"}}></span>
                  </div>
                  
                  <h1 className="fw-bold h2 mb-4"style={{color:"white"}}>
                    Bem-vindo ao MeD.<br/>Seu sistema de gestão  de pacientes inteligente.
                  </h1>
                  
                  {/* Lista de Benefícios */}
                  <div className="benefits mt-5">
                    <div className="benefit-item">
                      <div className="benefit-icon " style={{fontSize:'40px',color:"white"}}><i className="bi bi-globe-americas-fill pe-3"></i><strong style={{color:"white",fontSize:'20px'}}>Gestão Eficiente</strong></div>
                      <div>
                        
                        <p className="small opacity-75 mb-0" style={{color:"white"}}>Controle uma gestão eficiente de planos e faturamento de forma integrada.</p>
                      </div>
                    </div>
                    
                    <div className="benefit-item">
                      <div className="benefit-icon" style={{fontSize: '40px', color:"white"}}><i className="bi bi-calendar-day pe-3"></i><strong style={{color:"white",fontSize:'20px'}}>Agenda Digital</strong></div>
                      <div>
                      
                        <p className="small opacity-75 mb-0" style={{color:"white"}}>Gerencie seus pacientes agendados e os novos fluxos da clínica.</p>
                      </div>
                    </div>

                    <div className="benefit-item">
                      <div className="benefit-icon" style={{fontSize:'40px', color:"white"}}><i className="bi bi-calendar2-plus ms-0 pe-4 "></i><strong style={{color:"white",fontSize:'20px'}}>Prontuários</strong></div>
                      <div>
                        <p className="small opacity-75 mb-0" style={{color:"white"}}>Acesse e atualize os prontuários dos pacientes com rapidez e segurança.</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

                            {/* LADO DIREITO: CONTAINER DO PAINEL INTEIRO */}
              <div className="right-panel" style={{
                flex: '1 1 450px',
                minWidth: '320px',
                padding: '40px 20px',
                backgroundColor: '#F8F9FA',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                boxSizing: 'border-box'
              }}>
                
                {/* CARD BRANCO CENTRALIZADO (Isolado de interferências externas) */}
                <div className="login-form-card" style={{
                  backgroundColor: '#FFFFFF',
                  width: '100%',
                  maxWidth: '420px',
                  padding: '45px 35px',
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
                  boxSizing: 'border-box',
                  display: 'block' /* Força o comportamento de bloco clássico para não empilhar errado */
                }}>
                  
                  {/* Bloco do Avatar Médico */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                    <div style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      backgroundColor: '#F0F2F5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px'
                    }}>
                      <img src="./src/images/login-image.png" alt="" style={{width:'60px',height:'60px',borderRadius:'50%'}}/>️
                    </div>
                  </div>

                  {/* Título Principal */}
                  <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                    <h2 style={{ 
                      fontWeight: '700', 
                      color: '#212529', 
                      fontSize: '28px', 
                      margin: '0',
                      letterSpacing: '-0.5px'
                    }}>
                      Acesse sua conta
                    </h2>
                  </div>

                  <form onSubmit={handleSubmit} style={{ display: 'block', margin: '0', padding: '0' }}>
                    
                    {/* Campo E-mail */}
                    <div style={{ marginBottom: '20px', display: 'block', textAlign: 'left' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                        E-mail Profissional
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: '16px', fontSize: '18px', zIndex: '5', pointerEvents: 'none' ,opacity: '0.3' }}>
                          📧
                        </span>
                        <input 
                          type="email" 
                          placeholder="seu@email.com" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          required
                          style={{ 
                            paddingLeft: '48px', 
                            height: '50px', 
                            borderRadius: '10px', 
                            border: '1px solid #DEE2E6', 
                            width: '100%',
                            fontSize: '15px',
                            backgroundColor: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {/* Campo Senha */}
                    <div style={{ marginBottom: '25px', display: 'block', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#495057', margin: '0' }}>
                          Senha
                        </label>
                        <span 
                          onClick={() => {/* lógica de recuperar senha */}}
                          style={{ color: '#1E6B65', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Esqueceu a senha?
                        </span>
                      </div>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: '16px', fontSize: '18px', zIndex: '5', pointerEvents: 'none' , opacity: '0.3' }}>
                          🔒
                        </span>
                        <input 
                          type="password" 
                          placeholder="Sua senha secreta" 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          required
                          style={{ 
                            paddingLeft: '48px', 
                            height: '50px', 
                            borderRadius: '10px', 
                            border: '1px solid #DEE2E6', 
                            width: '100%',
                            fontSize: '15px',
                            backgroundColor: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {/* Botão Entrar Ocupando 100% */}
                    <div style={{ display: 'block', marginBottom: '25px' }}>
                      <button 
                        type="submit" 
                        style={{
                          backgroundColor: '#1E6B65',
                          color: '#FFFFFF',
                          width: '100%',
                          height: '50px',
                          borderRadius: '10px',
                          border: 'none',
                          fontWeight: '700',
                          fontSize: '15px',
                          letterSpacing: '0.5px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(30, 107, 101, 0.15)',
                          display: 'block'
                        }}
                      >
                        ENTRAR NO SISTEMA
                      </button>
                    </div>

                    {/* Seção Criar Conta */}
                    <div style={{ textAlign: 'center', paddingTop: '15px', borderTop: '1px solid #E9ECEF', marginBottom: '20px' }}>
                      <span style={{ color: '#6C757D', fontSize: '14px' }}>Não possui conta? </span>
                      <span 
                        onClick={() => navigate("/register")} 
                        style={{ color: '#1E6B65', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                      >
                        Crie uma agora
                      </span>
                    </div>
                  </form>

                  {/* Rodapé de Termos */}
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#6C757D', marginTop: '10px' }}>
                    <span style={{ cursor: 'pointer' }}>Termos de Uso</span>
                    <span style={{ margin: '0 8px' }}>|</span>
                    <span style={{ cursor: 'pointer' }}>Política de Privacidade</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
    );
} 

export default Login;