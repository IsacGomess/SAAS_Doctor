import { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';
import { addMembro, getMembros, deleteMembro } from '../../clinic/hooks/membroService';
import { getSubscription } from '../../../services/billing';
import './ClinicaOnboarding.css';

function ClinicaOnboarding() {
  const auth = useAuth();
  const [clinica, setClinica] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
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
    role: 'recepcionista',
    registroProf: ''
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [messageMembro, setMessageMembro] = useState(null);
  const [errorMembro, setErrorMembro] = useState(null);
  const [deletingMembroId, setDeletingMembroId] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingMemberData, setEditingMemberData] = useState({ email: '', registroProf: '', name: '' });
  const [adminEditingRegistro, setAdminEditingRegistro] = useState(false);
  const [convenios, setConvenios] = useState([]);
  const [isLoadingConvenios, setIsLoadingConvenios] = useState(false);
  const [newConvenioName, setNewConvenioName] = useState("");
  const [messageConvenio, setMessageConvenio] = useState(null);
  const [errorConvenio, setErrorConvenio] = useState(null);
  const [togglingConvenioId, setTogglingConvenioId] = useState(null);
  const [savingProfessionalData, setSavingProfessionalData] = useState(false);
  const [professionalForm, setProfessionalForm] = useState({
    profissao: '',
    conselhoProfissional: '',
    conselhoUf: '',
    numeroRegistroProfissional: '',
    valorParticularPadrao: ''
  });

  const formatCurrencyFromCents = (value) => {
    const number = Number(value || 0);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(number / 100);
  };

  const buildMemberBillingMessage = (billing) => {
    if (!billing) return 'Membro adicionado com sucesso!';

    if (billing.extraProfessionals > 0) {
      const ciclo = billing.billingCycleLabel || 'próximo ciclo';
      const valor = formatCurrencyFromCents(billing.monthlyPriceCents || 0);
      return `Membro adicionado com sucesso! Há ${billing.extraProfessionals} profissional(is) adicional(is) acima do limite de 5. Cobrança de ${valor} no ${ciclo}.`;
    }

    return 'Membro adicionado com sucesso! Dentro do limite de cinco profissionais incluídos.';
  };

  useEffect(() => {
    let mounted = true;

    const loadPlan = async () => {
      setIsLoadingPlan(true);
      try {
        const response = await getSubscription();
        if (!mounted) return;
        setSubscriptionPlan(response?.subscription?.plan || null);
      } catch (err) {
        if (!mounted) return;
        setSubscriptionPlan(null);
      } finally {
        if (mounted) setIsLoadingPlan(false);
      }
    };

    loadPlan();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProfessionalData = async () => {
      try {
        const response = await api.get('/api/users/me');
        if (!mounted || !response?.data?.user) return;

        const user = response.data.user;
        setProfessionalForm({
          profissao: user.profissao || '',
          conselhoProfissional: user.conselhoProfissional || '',
          conselhoUf: user.conselhoUf || '',
          numeroRegistroProfissional: user.numeroRegistroProfissional || user.registroProf || '',
          valorParticularPadrao: user.valorParticularPadrao ?? ''
        });
      } catch (err) {
        console.error('Erro ao carregar dados profissionais:', err);
      }
    };

    loadProfessionalData();

    return () => {
      mounted = false;
    };
  }, []);

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
          // set current user id if available
          try {
            const me = await api.get('/api/users/me');
            setCurrentUserId(me.data.user?._id || null);
          } catch (e) {
            // ignore
          }
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

        const clinicName = response.data.clinica?.name || form.name || '';
        if (clinicName) {
          localStorage.setItem('clinicName', clinicName);
        }

        // store role and userId/registroProf so UI updates immediately
        if (response.data.user?.role) localStorage.setItem('role', response.data.user.role);
        if (response.data.user?._id) localStorage.setItem('userId', response.data.user._id);
        if (response.data.user?.registroProf) localStorage.setItem('registroProf', response.data.user.registroProf);
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
      // client-side validation: registroProf required unless recepcionista
      if (formMembro.role !== 'recepcionista' && !formMembro.registroProf.trim()) {
        setErrorMembro('Número de registro é obrigatório para este cargo.');
        return;
      }

      const data = await addMembro(formMembro);
      console.log('✅ Membro adicionado com sucesso:', data);
      setFormMembro({ name: '', email: '', password: '', role: 'recepcionista', registroProf: '' });
      await auth.refreshUserInfo();
      setMessageMembro(buildMemberBillingMessage(data?.billing));
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
      const data = await deleteMembro(membroId);
      console.log('✅ Membro removido com sucesso:', membroId, data);
      await auth.refreshUserInfo();
      setMessageMembro(data?.billing?.extraProfessionals > 0
        ? `Membro removido com sucesso! O plano voltou para ${data.billing.extraProfessionals} profissional(is) adicional(is) acima do limite.`
        : 'Membro removido com sucesso!');
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

  const handleProfessionalFieldChange = (event) => {
    const { name, value } = event.target;
    setProfessionalForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfessionalData = async (event) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const normalizedValue = professionalForm.valorParticularPadrao === ''
      ? null
      : Number(String(professionalForm.valorParticularPadrao).replace(',', '.'));

    if (normalizedValue !== null && (Number.isNaN(normalizedValue) || normalizedValue < 0)) {
      setError('Valor particular padrão deve ser um número não negativo.');
      return;
    }

    const payload = {
      profissao: professionalForm.profissao.trim() || null,
      conselhoProfissional: professionalForm.conselhoProfissional.trim() || null,
      conselhoUf: professionalForm.conselhoUf.trim().toUpperCase() || null,
      numeroRegistroProfissional: professionalForm.numeroRegistroProfissional.trim() || null,
      registroProf: professionalForm.numeroRegistroProfissional.trim() || null,
      valorParticularPadrao: normalizedValue
    };

    setSavingProfessionalData(true);
    try {
      const response = await api.patch('/api/users/me', payload);
      const user = response?.data?.user || {};
      const resolvedRegistroProf = user.registroProf || user.numeroRegistroProfissional || '';

      setProfessionalForm((prev) => ({
        ...prev,
        profissao: user.profissao || '',
        conselhoProfissional: user.conselhoProfissional || '',
        conselhoUf: user.conselhoUf || '',
        numeroRegistroProfissional: user.numeroRegistroProfissional || user.registroProf || '',
        valorParticularPadrao: user.valorParticularPadrao ?? ''
      }));

      if (resolvedRegistroProf) {
        localStorage.setItem('registroProf', resolvedRegistroProf);
      } else {
        localStorage.removeItem('registroProf');
      }

      if (user.name) {
        localStorage.setItem('userName', user.name);
      }

      window.dispatchEvent(new CustomEvent('user-profile-updated'));

      setMessage('Dados profissionais atualizados com sucesso!');
      auth.refreshUserInfo();
    } catch (err) {
      const apiMessage = err?.response?.data?.message || 'Não foi possível salvar os dados profissionais.';
      setError(apiMessage);
    } finally {
      setSavingProfessionalData(false);
    }
  };


  return (
    <div className="clinica-onboarding-page onboarding-page-shell">
      <h2 className="onboarding-page-title">{subscriptionPlan === 'professional' ? 'Meus dados profissionais' : 'Minha Clínica'}</h2>
      <p>
        {subscriptionPlan === 'professional'
          ? 'Atualize seus dados profissionais vinculados à sua assinatura MED1PE Profissional.'
          : 'Use esta página para criar ou visualizar a clínica vinculada ao seu usuário.'}
      </p>

      {isLoading || isLoadingPlan ? (
        <div>Carregando...</div>
      ) : subscriptionPlan === 'professional' ? (
        <div className="card p-4 onboarding-surface-card">
          <h3>Meus dados profissionais</h3>
          <form onSubmit={handleSaveProfessionalData} className="onboarding-form-grid">
            <label>
              Profissão
              <input
                type="text"
                name="profissao"
                value={professionalForm.profissao}
                onChange={handleProfessionalFieldChange}
                placeholder="Ex: Fisioterapeuta"
                className="onboarding-input"
              />
            </label>

            <div className="onboarding-two-col-grid">
              <label>
                UF do conselho
                <input
                  type="text"
                  name="conselhoUf"
                  value={professionalForm.conselhoUf}
                  onChange={handleProfessionalFieldChange}
                  maxLength={2}
                  placeholder="Ex: PE"
                  className="onboarding-input onboarding-input-uppercase"
                />
              </label>

              <label>
                Número de registro
                <input
                  type="text"
                  name="numeroRegistroProfissional"
                  value={professionalForm.numeroRegistroProfissional}
                  onChange={handleProfessionalFieldChange}
                  placeholder="Ex: 12345"
                  className="onboarding-input"
                />
              </label>
            </div>

            <label>
              Valor particular padrão (R$)
              <input
                type="number"
                name="valorParticularPadrao"
                value={professionalForm.valorParticularPadrao}
                onChange={handleProfessionalFieldChange}
                min="0"
                step="0.01"
                placeholder="Ex: 180.00"
                className="onboarding-input"
              />
            </label>

            <small style={{ color: '#6c757d' }}>
              O valor particular é opcional e funciona apenas como padrão configurável.
            </small>

            <button
              type="submit"
              disabled={savingProfessionalData}
              className="onboarding-primary-btn"
              style={{ cursor: savingProfessionalData ? 'not-allowed' : 'pointer', opacity: savingProfessionalData ? 0.7 : 1 }}
            >
              {savingProfessionalData ? 'Salvando...' : 'Salvar dados profissionais'}
            </button>
          </form>
        </div>
      ) : auth.clinicaId && clinica ? (
        <div className="card p-4 mb-4 onboarding-surface-card">
          <h3>{clinica.name}</h3>
          <p><strong>ID da Clínica:</strong> {clinica._id}</p>
          <p><strong>CNPJ:</strong> {clinica.cnpj || 'Não informado'}</p>
          <p><strong>Endereço:</strong> {clinica.address || 'Não informado'}</p>
          <p><strong>Telefone:</strong> {clinica.phone || 'Não informado'}</p>
          <p><strong>E-mail:</strong> {clinica.email || 'Não informado'}</p>
          <p><strong>Administrador:</strong> {clinica.donoId && clinica.donoId.name ? clinica.donoId.name : auth.userName}</p>
          {clinica.donoId && currentUserId && clinica.donoId._id === currentUserId && (
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#333', marginBottom: 6 }}>Seu Número de Registro Profissional</label>
              <div className="onboarding-inline-actions">
                <input
                  type="text"
                  value={clinica.donoId.registroProf || ''}
                  onChange={(e) => {
                    setClinica((prev) => ({
                      ...prev,
                      donoId: { ...prev.donoId, registroProf: e.target.value }
                    }));
                  }}
                  placeholder="Ex: CRM12345"
                  disabled={!!clinica.donoId.registroProf && !adminEditingRegistro}
                  className="onboarding-input"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={async () => {
                    // se já existe registro e não está em edição, entra em modo edição
                    if (!adminEditingRegistro && clinica.donoId.registroProf) {
                      setAdminEditingRegistro(true);
                      return;
                    }

                    try {
                      const resp = await api.patch('/api/users/me', { registroProf: clinica.donoId.registroProf });
                      loadMembros();
                      const updatedUser = resp.data.user;
                      setMessage('Registro profissional salvo com sucesso!');
                      localStorage.setItem('registroProf', updatedUser.registroProf || '');
                      setAdminEditingRegistro(false);
                      auth.refreshUserInfo();
                    } catch (err) {
                      console.error('Erro ao salvar registroProf:', err);
                      setError('Não foi possível salvar o número de registro');
                    }
                  }}
                  className="onboarding-primary-btn"
                  style={{ padding: '8px 12px' }}
                >{adminEditingRegistro || !clinica.donoId.registroProf ? 'Salvar' : 'Editar'}</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-4 onboarding-surface-card">
          <h3>Configurar nova clínica</h3>
          <form onSubmit={handleSubmit} className="onboarding-form-grid">
            <label>
              Nome da clínica
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="onboarding-input"
              />
            </label>
            <label>
              CNPJ
              <input
                type="text"
                name="cnpj"
                value={form.cnpj}
                onChange={handleChange}
                className="onboarding-input"
              />
            </label>
            <label>
              Endereço
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="onboarding-input"
              />
            </label>
            <label>
              Telefone
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="onboarding-input"
              />
            </label>
            <label>
              E-mail de contato
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="onboarding-input"
              />
            </label>
            <button type="submit" className="onboarding-primary-btn">
              Criar Clínica
            </button>
          </form>
        </div>
      )}

      {message && <div style={{ marginTop: 16, color: '#1E6B65' }}>{message}</div>}
      {error && <div style={{ marginTop: 16, color: '#c0392b' }}>{error}</div>}

      {/* SEÇÃO DE MEMBROS DA EQUIPE */}
      {subscriptionPlan !== 'professional' && auth.clinicaId && clinica && (
        <div className="onboarding-section-block">
          <h3>Gerenciar Equipe</h3>
          <p>Adicione médicos, enfermeiros e recepcionistas à sua clínica.</p>

          {/* Formulário de Novo Membro */}
          <div className="card p-4 mb-4 onboarding-surface-card onboarding-spacer-top">
            <h4>Adicionar Novo Membro</h4>
            <form onSubmit={handleSubmitMembro} className="onboarding-form-grid onboarding-form-two-columns">
              <label>
                Nome Completo
                <input
                  type="text"
                  name="name"
                  value={formMembro.name}
                  onChange={handleChangeMembro}
                  required
                  placeholder="Ex: João Silva"
                  className="onboarding-input"
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
                  className="onboarding-input"
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
                  className="onboarding-input"
                />
              </label>
              <label>
                Cargo
                <select
                  name="role"
                  value={formMembro.role}
                  onChange={handleChangeMembro}
                  className="onboarding-input"
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
              {formMembro.role !== 'recepcionista' && (
                <label>
                  Número de Registro Profissional
                  <input
                    type="text"
                    name="registroProf"
                    value={formMembro.registroProf}
                    onChange={handleChangeMembro}
                    required={formMembro.role !== 'recepcionista'}
                    placeholder="Ex: CRM12345"
                    className="onboarding-input"
                  />
                </label>
              )}
              <button
                type="submit"
                className="onboarding-primary-btn onboarding-full-width"
              >
                Adicionar Membro
              </button>
            </form>
            {messageMembro && <div style={{ marginTop: 12, color: '#1E6B65' }}>{messageMembro}</div>}
            {errorMembro && <div style={{ marginTop: 12, color: '#c0392b' }}>{errorMembro}</div>}
          </div>

          {/* Lista de Membros */}
          <div className="card p-4 onboarding-surface-card">
            <h4>Membros da Equipe ({membros.length})</h4>
            {isLoadingMembros ? (
              <p>Carregando membros...</p>
            ) : membros.length === 0 ? (
              <p style={{ color: '#999' }}>Nenhum membro cadastrado ainda.</p>
            ) : (
              <div className="onboarding-list-stack">
                {membros.map((membro) => (
                  <div
                    key={membro._id}
                    className="onboarding-list-row"
                    style={{
                      padding: 12,
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: membro.role === 'administrador' ? '#f0faf8' : '#fff'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      {editingMemberId === membro._id ? (
                        <div style={{ display: 'grid', gap: 6 }}>
                          <input style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} value={editingMemberData.name} onChange={(e) => setEditingMemberData(prev => ({ ...prev, name: e.target.value }))} />
                          <input style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} value={editingMemberData.email} onChange={(e) => setEditingMemberData(prev => ({ ...prev, email: e.target.value }))} />
                          <input style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} value={editingMemberData.registroProf} onChange={(e) => setEditingMemberData(prev => ({ ...prev, registroProf: e.target.value }))} placeholder="Registro Profissional" />
                        </div>
                      ) : (
                        <>
                          <strong>{membro.name}</strong>
                          {membro.role === 'administrador' && (
                            <p style={{ margin: '2px 0 0 0', color: '#1E6B65', fontSize: 12, fontWeight: 'bold' }}>👑 Criador da Clínica</p>
                          )}
                          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 14 }}>{membro.email}{membro.registroProf ? ` • Reg.: ${membro.registroProf}` : ''}</p>
                        </>
                      )}
                    </div>
                    <div className="onboarding-row-actions" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
                      {editingMemberId === membro._id ? (
                        <>
                          <button
                            onClick={async () => {
                              try {
                                const payload = { email: editingMemberData.email, registroProf: editingMemberData.registroProf, name: editingMemberData.name };
                                const resp = await api.patch(`/api/users/membros/${membro._id}`, payload);
                                setMessageMembro('Membro atualizado com sucesso!');
                                setEditingMemberId(null);
                                setEditingMemberData({ email: '', registroProf: '', name: '' });
                                if (localStorage.getItem('userId') === membro._id) {
                                  if (resp.data.membro.registroProf) localStorage.setItem('registroProf', resp.data.membro.registroProf);
                                  if (resp.data.membro.email) localStorage.setItem('userEmail', resp.data.membro.email);
                                  auth.refreshUserInfo();
                                }
                                loadMembros();
                              } catch (err) {
                                console.error('Erro ao atualizar membro:', err);
                                setErrorMembro('Não foi possível atualizar membro');
                              }
                            }}
                            style={{ padding: '6px 12px', borderRadius: 20, border: 'none', background: '#2d8f6f', color: '#fff', cursor: 'pointer', fontSize: 12 }}
                          >Salvar</button>
                          <button onClick={() => { setEditingMemberId(null); setEditingMemberData({ email: '', registroProf: '', name: '' }); }} style={{ padding: '6px 12px', borderRadius: 20, border: 'none', background: '#ccc', color: '#222', cursor: 'pointer', fontSize: 12 }}>Cancelar</button>
                        </>
                      ) : (
                        <>
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
                          {localStorage.getItem('role') === 'administrador' && (
                            <button
                              onClick={() => {
                                setEditingMemberId(membro._id);
                                setEditingMemberData({ email: membro.email || '', registroProf: membro.registroProf || '', name: membro.name || '' });
                              }}
                              style={{ padding: '6px 12px', borderRadius: 20, border: 'none', background: '#1976d2', color: '#fff', cursor: 'pointer', fontSize: 12 }}
                            >Editar</button>
                          )}
                        </>
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
      {subscriptionPlan !== 'professional' && auth.clinicaId && clinica && (
        <div className="onboarding-section-block">
          <h3>Gerenciar Planos de Saúde / Convênios</h3>
          <p>Adicione ou remova planos de saúde disponíveis para seus pacientes.</p>

          {/* Formulário de Novo Convênio */}
          <div className="card p-4 mb-4 onboarding-surface-card onboarding-spacer-top">
            <h4>Adicionar Novo Convênio</h4>
            <form onSubmit={handleCreateConvenio} className="onboarding-convenio-form">
              <input
                type="text"
                value={newConvenioName}
                onChange={(e) => setNewConvenioName(e.target.value)}
                placeholder="Ex: Allianz Saúde, Geap, Mediservice..."
                className="onboarding-input"
                style={{ flex: 1, fontSize: 14 }}
              />
              <button
                type="submit"
                className="onboarding-primary-btn"
                style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                + Adicionar Convênio
              </button>
            </form>
            {messageConvenio && <div style={{ marginTop: 12, color: '#27ae60', fontWeight: 500 }}>✅ {messageConvenio}</div>}
            {errorConvenio && <div style={{ marginTop: 12, color: '#c0392b', fontWeight: 500 }}>❌ {errorConvenio}</div>}
          </div>

          {/* Lista de Convênios */}
          <div className="card p-4 onboarding-surface-card">
            <h4>Convênios Cadastrados ({convenios.filter(c => c.ativo).length})</h4>
            {isLoadingConvenios ? (
              <p>Carregando convênios...</p>
            ) : convenios.length === 0 ? (
              <p style={{ color: '#999', marginTop: 12 }}>Nenhum convênio cadastrado ainda.</p>
            ) : (
              <div className="onboarding-list-stack">
                {convenios.map((convenio) => (
                  <div
                    key={convenio._id}
                    className="onboarding-list-row"
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