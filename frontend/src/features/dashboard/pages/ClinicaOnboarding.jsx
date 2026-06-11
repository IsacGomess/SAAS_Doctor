import { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';
import { addMembro, getMembros, deleteMembro } from '../../clinic/hooks/membroService';

function ClinicaOnboarding() {
  const auth = useAuth();
  const [clinica, setClinica] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [membros, setMembros] = useState([]);
  const [isLoadingMembros, setIsLoadingMembros] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    cnpj: '',
    address: '',
    phone: '',
    email: ''
  });

  const [formMembro, setFormMembro] = useState({
    name: '',
    email: '',
    password: '',
    role: 'recepcionista'
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [messageMembro, setMessageMembro] = useState(null);
  const [errorMembro, setErrorMembro] = useState(null);
  const [deletingMembroId, setDeletingMembroId] = useState(null);
  const [convenios, setConvenios] = useState([]);
  const [isLoadingConvenios, setIsLoadingConvenios] = useState(false);
  const [newConvenioName, setNewConvenioName] = useState("");
  const [messageConvenio, setMessageConvenio] = useState(null);
  const [errorConvenio, setErrorConvenio] = useState(null);
  const [togglingConvenioId, setTogglingConvenioId] = useState(null);

  // Carregar clínica
  useEffect(() => {
    const fetchClinica = async () => {
      if (!auth.clinicaId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/clinics/me');
        if (response.data?.clinica) {
          setClinica(response.data.clinica);
          loadMembros();
          loadConvenios();
        }
      } catch (err) {
        console.error('Erro ao buscar clínica:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinica();
  }, [auth.clinicaId]);

  // Carregar membros
  const loadMembros = async () => {
    setIsLoadingMembros(true);
    try {
      const data = await getMembros();
      setMembros(data.membros || []);
    } catch (err) {
      console.error('Erro ao buscar membros:', err);
    } finally {
      setIsLoadingMembros(false);
    }
  };

  // Carregar convênios
  const loadConvenios = async () => {
    setIsLoadingConvenios(true);
    try {
      const response = await api.get('/api/convenios/list');
      setConvenios(response.data.convenios || []);
    } catch (err) {
      console.error('Erro ao buscar convênios:', err);
    } finally {
      setIsLoadingConvenios(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeMembro = (event) => {
    const { name, value } = event.target;
    setFormMembro((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const response = await api.post('/api/clinics', form);

      if (response.data?.accessToken) {
        // Salva o novo token com clinicaId
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('userName', response.data.user.name);
        
        const clinicaId = response.data.user.clinicaId || response.data.clinica?._id;
        if (clinicaId) {
          localStorage.setItem('clinicaId', clinicaId);
          console.log('Clínica criada com ID:', clinicaId);
        }
      }

      setClinica(response.data.clinica);
      setMessage('Clínica criada com sucesso!');
      
      // Aguarda um pouco para garantir sincronização do localStorage
      setTimeout(() => {
        auth.refreshUserInfo();
        loadMembros();
      }, 100);
    } catch (err) {
      const details = err.response?.data?.message || 'Erro ao criar clínica';
      console.error('Erro ao criar clínica:', err);
      setError(details);
    }
  };

  const handleSubmitMembro = async (event) => {
    event.preventDefault();
    setMessageMembro(null);
    setErrorMembro(null);

    console.log('🔵 Tentando adicionar membro...');
    console.log('   auth.clinicaId:', auth.clinicaId);
    console.log('   Form data:', formMembro);

    try {
      const data = await addMembro(formMembro);
      console.log('✅ Membro adicionado com sucesso:', data);
      setFormMembro({ name: '', email: '', password: '', role: 'recepcionista' });
      setMessageMembro('Membro adicionado com sucesso!');
      loadMembros();
    } catch (err) {
      console.error('❌ Erro ao adicionar membro:', err);
      const details = err.message || 'Erro ao adicionar membro';
      setErrorMembro(details);
    }
  };

  const handleDeleteMembro = async (membroId, membroName) => {
    if (!window.confirm(`Tem certeza que deseja remover ${membroName} da equipe?`)) {
      return;
    }

    setDeletingMembroId(membroId);
    try {
      await deleteMembro(membroId);
      console.log('✅ Membro removido com sucesso:', membroId);
      setMessageMembro('Membro removido com sucesso!');
      loadMembros();
    } catch (err) {
      console.error('❌ Erro ao remover membro:', err);
      const details = err.message || 'Erro ao remover membro';
      setErrorMembro(details);
    } finally {
      setDeletingMembroId(null);
    }
  };

  const handleCreateConvenio = async (e) => {
    e.preventDefault();
    setMessageConvenio(null);
    setErrorConvenio(null);

    if (!newConvenioName.trim()) {
      setErrorConvenio('O nome do convênio é obrigatório');
      return;
    }

    try {
      await api.post('/api/convenios/create', { nome: newConvenioName.trim() });
      setNewConvenioName('');
      setMessageConvenio('Convênio adicionado com sucesso!');
      loadConvenios();
    } catch (err) {
      console.error('❌ Erro ao adicionar convênio:', err);
      const details = err.response?.data?.message || err.message || 'Erro ao adicionar convênio';
      setErrorConvenio(details);
    }
  };

  const handleToggleConvenioStatus = async (convenioId, convenioNome, currentStatus) => {
    const novoStatus = !currentStatus;
    setTogglingConvenioId(convenioId);
    try {
      await api.put(`/api/convenios/${convenioId}/toggle`);
      const statusText = novoStatus ? 'ativado' : 'desativado';
      setMessageConvenio(`Convênio ${statusText} com sucesso!`);
      loadConvenios();
    } catch (err) {
      console.error('❌ Erro ao atualizar convênio:', err);
      const details = err.response?.data?.message || err.message || 'Erro ao atualizar convênio';
      setErrorConvenio(details);
    } finally {
      setTogglingConvenioId(null);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      medico: '👨‍⚕️ Médico',
      enfermeiro: '👩‍⚕️ Enfermeiro',
      recepcionista: '📞 Recepcionista',
      administrador: '🔑 Administrador',
      fisioterapeuta: '🏥 Fisioterapeuta',
      nutricionista: '🥗 Nutricionista',
      esteticista: '💄 Esteticista',
      dentista: '🦷 Dentista',
      nutrologo: '📋 Nutrólogo'
    };
    return labels[role] || role;
  };


  return (
    <div className="clinica-onboarding-page" style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h2>Minha Clínica</h2>
      <p>Use esta página para criar ou visualizar a clínica vinculada ao seu usuário.</p>

      {isLoading ? (
        <div>Carregando...</div>
      ) : auth.clinicaId && clinica ? (
        <div className="card p-4 mb-4" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
          <h3>{clinica.name}</h3>
          <p><strong>ID da Clínica:</strong> {clinica._id}</p>
          <p><strong>CNPJ:</strong> {clinica.cnpj || 'Não informado'}</p>
          <p><strong>Endereço:</strong> {clinica.address || 'Não informado'}</p>
          <p><strong>Telefone:</strong> {clinica.phone || 'Não informado'}</p>
          <p><strong>E-mail:</strong> {clinica.email || 'Não informado'}</p>
          <p><strong>Administrador:</strong> {auth.userName}</p>
        </div>
      ) : (
        <div className="card p-4" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
          <h3>Configurar nova clínica</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 16 }}>
            <label>
              Nome da clínica
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
              />
            </label>
            <label>
              CNPJ
              <input
                type="text"
                name="cnpj"
                value={form.cnpj}
                onChange={handleChange}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
              />
            </label>
            <label>
              Endereço
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
              />
            </label>
            <label>
              Telefone
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
              />
            </label>
            <label>
              E-mail de contato
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
              />
            </label>
            <button type="submit" style={{ padding: '12px 18px', borderRadius: 10, border: 'none', background: '#1E6B65', color: '#fff', cursor: 'pointer' }}>
              Criar Clínica
            </button>
          </form>
        </div>
      )}

      {message && <div style={{ marginTop: 16, color: '#1E6B65' }}>{message}</div>}
      {error && <div style={{ marginTop: 16, color: '#c0392b' }}>{error}</div>}

      {/* SEÇÃO DE MEMBROS DA EQUIPE */}
      {auth.clinicaId && clinica && (
        <div style={{ marginTop: 32 }}>
          <h3>Gerenciar Equipe</h3>
          <p>Adicione médicos, enfermeiros e recepcionistas à sua clínica.</p>

          {/* Formulário de Novo Membro */}
          <div className="card p-4 mb-4" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 8px 20px rgba(0,0,0,0.05)', marginTop: 16 }}>
            <h4>Adicionar Novo Membro</h4>
            <form onSubmit={handleSubmitMembro} style={{ display: 'grid', gap: 16, marginTop: 16, gridTemplateColumns: '1fr 1fr' }}>
              <label>
                Nome Completo
                <input
                  type="text"
                  name="name"
                  value={formMembro.name}
                  onChange={handleChangeMembro}
                  required
                  placeholder="Ex: João Silva"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', marginTop: 4 }}
                />
              </label>
              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  value={formMembro.email}
                  onChange={handleChangeMembro}
                  required
                  placeholder="ex@clinica.com"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', marginTop: 4 }}
                />
              </label>
              <label>
                Senha Temporária
                <input
                  type="password"
                  name="password"
                  value={formMembro.password}
                  onChange={handleChangeMembro}
                  required
                  placeholder="Mínimo 6 caracteres"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', marginTop: 4 }}
                />
              </label>
              <label>
                Cargo
                <select
                  name="role"
                  value={formMembro.role}
                  onChange={handleChangeMembro}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', marginTop: 4 }}
                >
                  <option value="recepcionista">Recepcionista</option>
                  <option value="medico">Médico</option>
                  <option value="enfermeiro">Enfermeiro</option>
                  <option value="fisioterapeuta">Fisioterapeuta</option>
                  <option value="nutricionista">Nutricionista</option>
                  <option value="esteticista">Esteticista</option>
                  <option value="dentista">Dentista</option>
                  <option value="nutrologo">Nutrólogo</option>
                </select>
              </label>
              <button
                type="submit"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#1E6B65',
                  color: '#fff',
                  cursor: 'pointer',
                  gridColumn: '1 / -1'
                }}
              >
                Adicionar Membro
              </button>
            </form>
            {messageMembro && <div style={{ marginTop: 12, color: '#1E6B65' }}>{messageMembro}</div>}
            {errorMembro && <div style={{ marginTop: 12, color: '#c0392b' }}>{errorMembro}</div>}
          </div>

          {/* Lista de Membros */}
          <div className="card p-4" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
            <h4>Membros da Equipe ({membros.length})</h4>
            {isLoadingMembros ? (
              <p>Carregando membros...</p>
            ) : membros.length === 0 ? (
              <p style={{ color: '#999' }}>Nenhum membro cadastrado ainda.</p>
            ) : (
              <div style={{ marginTop: 16 }}>
                {membros.map((membro) => (
                  <div
                    key={membro._id}
                    style={{
                      padding: 12,
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: membro.role === 'administrador' ? '#f0faf8' : '#fff'
                    }}
                  >
                    <div>
                      <strong>{membro.name}</strong>
                      {membro.role === 'administrador' && (
                        <p style={{ margin: '2px 0 0 0', color: '#1E6B65', fontSize: 12, fontWeight: 'bold' }}>👑 Criador da Clínica</p>
                      )}
                      <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 14 }}>{membro.email}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{
                        background: membro.role === 'administrador' ? '#1E6B65' : '#f0f0f0',
                        color: membro.role === 'administrador' ? '#fff' : '#333',
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: membro.role === 'administrador' ? 'bold' : 'normal'
                      }}>
                        {getRoleLabel(membro.role)}
                      </span>
                      {membro.role !== 'administrador' && (
                        <button
                          onClick={() => handleDeleteMembro(membro._id, membro.name)}
                          disabled={deletingMembroId === membro._id}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 20,
                            border: 'none',
                            background: '#c0392b',
                            color: '#fff',
                            cursor: deletingMembroId === membro._id ? 'not-allowed' : 'pointer',
                            opacity: deletingMembroId === membro._id ? 0.6 : 1,
                            fontSize: 12
                          }}
                        >
                          {deletingMembroId === membro._id ? 'Removendo...' : 'Remover'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEÇÃO DE GERENCIAMENTO DE CONVÊNIOS */}
      {auth.clinicaId && clinica && (
        <div style={{ marginTop: 32 }}>
          <h3>Gerenciar Planos de Saúde / Convênios</h3>
          <p>Adicione ou remova planos de saúde disponíveis para seus pacientes.</p>

          {/* Formulário de Novo Convênio */}
          <div className="card p-4 mb-4" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 8px 20px rgba(0,0,0,0.05)', marginTop: 16 }}>
            <h4>Adicionar Novo Convênio</h4>
            <form onSubmit={handleCreateConvenio} style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <input
                type="text"
                value={newConvenioName}
                onChange={(e) => setNewConvenioName(e.target.value)}
                placeholder="Ex: Allianz Saúde, Geap, Mediservice..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  fontSize: 14
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#1E6B65',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }}
              >
                + Adicionar Convênio
              </button>
            </form>
            {messageConvenio && <div style={{ marginTop: 12, color: '#27ae60', fontWeight: 500 }}>✅ {messageConvenio}</div>}
            {errorConvenio && <div style={{ marginTop: 12, color: '#c0392b', fontWeight: 500 }}>❌ {errorConvenio}</div>}
          </div>

          {/* Lista de Convênios */}
          <div className="card p-4" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
            <h4>Convênios Cadastrados ({convenios.filter(c => c.ativo).length})</h4>
            {isLoadingConvenios ? (
              <p>Carregando convênios...</p>
            ) : convenios.length === 0 ? (
              <p style={{ color: '#999', marginTop: 12 }}>Nenhum convênio cadastrado ainda.</p>
            ) : (
              <div style={{ marginTop: 16 }}>
                {convenios.map((convenio) => (
                  <div
                    key={convenio._id}
                    style={{
                      padding: 12,
                      marginBottom: 8,
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: convenio.ativo ? '#f9f9f9' : '#f0f0f0',
                      border: `1px solid ${convenio.ativo ? '#e0e0e0' : '#d0d0d0'}`,
                      opacity: convenio.ativo ? 1 : 0.7
                    }}
                  >
                    <div>
                      <strong style={{ color: convenio.ativo ? '#333' : '#999' }}>{convenio.nome}</strong>
                      <p style={{ 
                        margin: '4px 0 0 0', 
                        fontSize: 12, 
                        color: convenio.ativo ? '#1E6B65' : '#999',
                        fontWeight: 500
                      }}>
                        {convenio.ativo ? '✅ Ativo' : '⛔ Desativado'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleConvenioStatus(convenio._id, convenio.nome, convenio.ativo)}
                      disabled={togglingConvenioId === convenio._id}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: 'none',
                        background: convenio.ativo ? '#c0392b' : '#27ae60',
                        color: '#fff',
                        cursor: togglingConvenioId === convenio._id ? 'not-allowed' : 'pointer',
                        opacity: togglingConvenioId === convenio._id ? 0.6 : 1,
                        fontSize: 12,
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                      }}
                    >
                      {togglingConvenioId === convenio._id 
                        ? 'Atualizando...' 
                        : convenio.ativo ? '🗑️ Desativar' : '✓ Ativar'
                      }
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClinicaOnboarding;