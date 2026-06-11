import { useState } from "react";
import api from "../../../services/api";
import { useNavigate } from "react-router-dom"; // Importa o hook useNavigate

function Register() {
    const [name,setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [registroProf, setregistroProf] = useState("");
    const navigate = useNavigate(); // Inicializa o hook useNavigate

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/users/register', { name, email, password, registroProf });

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
        <div className="login-page-wrapper" style={{
    margin: 0,
    padding: 0,
    width: '100vw',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'stretch',
    backgroundColor: '#F8F9FA',
    overflowX: 'hidden',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    boxSizing: 'border-box'
  }}>
    <div style={{
      width: '100%',
      display: 'flex',
      flexWrap: 'wrap',
      minHeight: '100vh'
    }}>
      
      {/* ========================================================== */}
      {/* LADO ESQUERDO: PAINEL INSTITUCIONAL (VERDE MÉDICO)        */}
      {/* ========================================================== */}
      <div className="left-panel" style={{
        background: 'linear-gradient(135deg, #1E6B65 0%, #154D49 100%)',
        flex: '1 1 450px', 
        minWidth: '320px',
        padding: '40px 20px',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}>
        <div>
          {/* Nome do SaaS */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '50px' }}>
            <span style={{ fontSize: '28px', marginRight: '10px' }}></span>
            <span style={{ fontWeight: '700', fontSize: '24px', color: '#FFFFFF', letterSpacing: '0.5px' }}>
              MED Assistente
            </span>
          </div>
          
          <h1 style={{ fontWeight: '700', fontSize: '36px', color: '#FFFFFF', lineHeight: '1.3', marginBottom: '20px' }}>
            Junte-se à nossa rede de profissionais e modernize sua gestão de tempo.
          </h1>
        </div>
        
        {/* Benefícios */}
        <div className="benefits" style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'start', marginBottom: '30px', color: '#FFFFFF' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              minWidth: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '15px',
              fontSize: '70px'
            }}>
              🌍
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}>Prontuário Digital</strong>
              <p style={{ fontSize: '14px', opacity: '0.75', margin: 0 }}>Acesse o histórico de seus pacientes de qualquer lugar.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'start', color: '#FFFFFF' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              minWidth: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '15px',
              fontSize: '70px'
            }}>
              ⚡
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}>Organização no Diagnóstico</strong>
              <p style={{ fontSize: '14px', opacity: '0.75', margin: 0 }}>Ferramentas inteligentes para o dia a dia clínico.</p>
            </div>
          </div>
        </div>

        <div style={{ color: '#FFFFFF', opacity: '0.5', fontSize: '13px', marginTop: '4px' }}>
          © Médico Assistente - Gestão Inteligente
        </div>
      </div>

      {/* ========================================================== */}
      {/* LADO DIREITO: CARD DE FORMULÁRIO (BRANCO / CINZA)         */}
      {/* ========================================================== */}
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
        
        {/* CARD BRANCO CENTRALIZADO */}
        <div className="login-form-card" style={{
          backgroundColor: '#FFFFFF',
          width: '100%',
          maxWidth: '460px',
          padding: '45px 35px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
          boxSizing: 'border-box',
          display: 'block'
        }}>

          {/* Ícone Decorativo */}
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
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ 
              fontWeight: '700', 
              color: '#212529', 
              fontSize: '28px', 
              margin: '0',
              letterSpacing: '-0.5px'
            }}>
              Crie sua conta
            </h2>
            <p style={{ color: '#6C757D', margin: '5px 0 0 0', fontSize: '14px' }}>Preencha seus dados profissionais</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'block', margin: '0', padding: '0' }}>
            
            {/* Campo Nome Completo */}
            <div style={{ marginBottom: '20px', display: 'block', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                Nome Completo
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '16px', fontSize: '18px', zIndex: '5', pointerEvents: 'none' }}>
                  
                </span>
                <input 
                  type="text" 
                  placeholder="Dr(a). Nome Sobrenome" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
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

            {/* Campo E-mail */}
            <div style={{ marginBottom: '20px', display: 'block', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                E-mail Profissional
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '16px', fontSize: '18px', zIndex: '5', pointerEvents: 'none' }}>
                  
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

            {/* Linha dupla com as colunas nativas do Bootstrap */}
            <div className="row g-3" style={{ marginBottom: '25px', display: 'flex' }}>
              
              {/* Campo Senha */}
              <div className="col-md-6" style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                  Senha
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '16px', fontSize: '18px', zIndex: '5', pointerEvents: 'none' }}>
                    
                  </span>
                  <input 
                    type="password" 
                    placeholder="******" 
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

              {/* Campo Conselho */}
              <div className="col-md-6" style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                  Registro do Conselho
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '16px', fontSize: '18px', zIndex: '5', pointerEvents: 'none' }}>
                    
                  </span>
                  <input 
                    type="text" 
                    placeholder="00000" 
                    value={registroProf} 
                    onChange={(e) => setregistroProf(e.target.value)} 
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

            </div>

            {/* Botão Finalizar Cadastro */}
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
                FINALIZAR CADASTRO
              </button>
            </div>

            {/* Link para Voltar ao Login */}
            <div style={{ textAlign: 'center', paddingTop: '15px', borderTop: '1px solid #E9ECEF', marginBottom: '10px' }}>
              <span style={{ color: '#6C757D', fontSize: '14px' }}>Já tem conta? </span>
              <span 
                onClick={() => navigate("/login")} 
                style={{ color: '#1E6B65', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
              >
                Faça login
              </span>
            </div>
          </form>

          {/* Rodapé Institucional */}
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#6C757D', marginTop: '20px' }}>
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

export default Register;
