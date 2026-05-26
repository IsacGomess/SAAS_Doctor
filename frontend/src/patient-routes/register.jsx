import api from "../services/api";
import { useState, useEffect, use } from "react";

export const Patients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [name, setName] = useState("");
    const [cpf, setCpf] = useState("");
    const [phone, setPhone] = useState("");
    const [observations, setObservations] = useState("");
    const [isPresent, setIsPresent] = useState(true);   
    {/*. busca global da clinica por pacientes */}
    useEffect(() => {
        const searchPatients = async () => {
            try {
                setLoading(true);
                
                const response = await api.get("/api/patients/atendance-list");

                console.log("lista de pacientes:", response.data);                
                setPatients(response.data.patients);
            
                
            } catch (error) {
                console.error("Erro ao buscar pacientes:", error);
                setPatients([]); // Define como vazio em caso de erro para evitar estado indefinido
               
            }
            finally {               
                 setLoading(false);
            }
        }
        searchPatients();
    }, []);

    const dataBaseCadaster = async (e) => {
        e.preventDefault();
            const newPatient = { name, cpf, phone, observations, isPresent };
        try {

            const response = await api.post("/api/patients/register-patient", newPatient);
          
            setShowForm(false);
            // Limpar os campos do formulário
            setName("");
            setCpf("");
            setPhone("");
            setObservations("");
            setIsPresent(true);
        
            
        }catch (error) {
            console.error("Erro ao cadastrar paciente:", error);
        }
    };

    // -------------------------------------------------------------
    
    // Tela de carregamento sutil
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status"></div>
                <span className="ms-2">Buscando pacientes...</span>
            </div>
        );
    }

    return (
        <div className="container-fluid pt-5 ps-0 pe-1 w-100" style={{ minHeight: '100%' }}>
            
            {/* Cabeçalho da Página */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold m-0" style={{ color: '#2C3E50' }}>Pacientes</h2>
                    <p className="text-muted m-0">Gerencie os prontuários e cadastros da sua clínica</p>
                </div>
                {/* Botão de cadastrar só aparece se o formulário estiver fechado */}
                {!showForm && (
                    <button 
                        className="btn text-white px-4 py-2 shadow-sm" 
                        style={{ backgroundColor: '#1E6B65' }}
                        onClick={() => setShowForm(true)}
                    >
                        + Novo Paciente
                    </button>
                )}
            </div>

            {/* SEÇÃO 1: FORMULÁRIO DE CADASTRO (Aparece se clicar em Novo Paciente) */}
            {showForm && (
                <div className="card border-0 shadow-sm rounded-3 mb-4 animate__animated animate__fadeIn">
                    <div className="card-body p-4">
                        <h5 className="fw-bold mb-3" style={{ color: '#1E6B65' }}>Cadastrar Novo Paciente</h5>
                        <form onSubmit={dataBaseCadaster}>
                            <div className="row g-3">
                                <div className="col-12 col-md-4">
                                    <label className="form-label text-muted small fw-bold">Nome Completo</label>
                                    <input type="text" className="form-control" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João Silva" />
                                </div>
                                <div className="col-12 col-md-4">
                                    <label className="form-label text-muted small fw-bold">CPF</label>
                                    <input type="text" className="form-control" required value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
                                </div>
                                <div className="col-12 col-md-4">
                                    <label className="form-label text-muted small fw-bold">Telefone / WhatsApp</label>
                                    <input type="text" className="form-control" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(81) 99999-9999" />
                                </div>
                                <div className="col-12 col-md-4">
                                    <label className="form-label text-muted small fw-bold">Observações</label>
                                    <input type="text" className="form-control" required value={observations} onChange={(e) => setObservations(e.target.value)} maxLength={70} placeholder="Observações sobre o paciente" />
                                </div>
                            </div>
                            <div className="d-flex gap-2 justify-content-end mt-4">
                                <button type="button" className="btn btn-light px-3" onClick={() => setShowForm(false)}>Cancelar</button>
                                <button type="submit" className="btn text-white px-4" style={{ backgroundColor: '#1E6B65' }}>Salvar Cadastro</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SEÇÃO 2: TABELA DE PACIENTES OU ESTADO VAZIO */}
            {patients.length === 0 ? (
                /* CASO O MÉDICO NÃO TENHA PACIENTES (Tela de Boas-vindas/Vazia) */
                <div className="card border-0 shadow-sm rounded-3 text-center py-5">
                    <div className="card-body py-5">
                        <div className="fs-1 mb-3">👥</div>
                        <h4 className="fw-bold text-dark">Nenhum paciente cadastrado</h4>
                        <p className="text-muted mx-auto" style={{ maxWidth: '400px' }}>
                            Você ainda não possui pacientes vinculados ao seu perfil. Comece cadastrando o seu primeiro paciente agora mesmo!
                        </p>
                        {!showForm && (
                            <button 
                                className="btn text-white mt-2 px-4 shadow-sm" 
                                style={{ backgroundColor: '#1E6B65' }}
                                onClick={() => setShowForm(true)}
                            >
                                Cadastrar meu primeiro paciente
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                /* CASO JÁ TENHA PACIENTES (Mostra a Tabela) */
                <div className="card border-0 shadow-sm rounded-3">
                    <div className="card-body p-4">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle m-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Nome do Paciente</th>
                                        <th>CPF</th>
                                        <th>Contato</th>
                                        <th>Observações</th>
                                        <th className="text-end">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patients.map((paciente) => (
                                        <tr key={paciente._id}>
                                            <td>
                                                <div className="fw-bold text-dark">{paciente.name}</div>
                                            </td>
                                            <td className="text-muted">{paciente.cpf}</td>
                                            <td className="text-muted">📞 {paciente.phone}</td>
                                             <td className="text-muted"> {paciente.observations}</td>
                                            <td className="text-end">
                                                <button className="btn btn-sm btn-outline-secondary me-2">Ver Histórico</button>
                                                <button className="btn btn-sm text-white" style={{ backgroundColor: '#1E6B65' }}>Abrir Prontuário</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
   


    
    

}