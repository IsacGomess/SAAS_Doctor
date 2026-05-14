import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom"; // Importa o hook useNavigate

function Dashboard() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [cpf, setCpf] = useState("");
    const [phone, setPhone] = useState("");
    const [observations, setObservations] = useState("");
    const [isPresent, setIsPresent] = useState(false);

    const registerPatients = async () => {
        try {
            const response = await api.post('/api/users/patients/register-patient',{name, cpf, phone, observations, isPresent});
            
            
            alert("Paciente registrado com sucesso!");


        } catch (error) {


            alert("Erro ao registrar paciente!");
        }
    

    }

    return (
      <div className="container-fluid py-4" style={{ backgroundColor: "#F4F7F6", minHeight: "100vh" }}>
        
        {/* Cabeçalho de Ações Rápidas */}
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
            <h2 className="fw-bold" style={{ color: "#2C3E50" }}>Painel de Pacientes</h2>
            <p className="text-muted small">Gerencie prontuários e consultas do dia.</p>
            </div>
            <button className="btn btn-primary d-flex align-items-center shadow-sm" style={{ borderRadius: "10px", padding: "10px 20px" }}>
            <span className="me-2">+</span> Novo Paciente
            </button>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px" }}>
            <div className="card-body">
            <div className="row g-3">
                <div className="col-md-8">
                <div className="input-group">
                    <span className="input-group-text bg-transparent border-end-0 text-muted">🔍</span>
                    <input type="text" className="form-control border-start-0 ps-0" placeholder="Buscar por nome, CPF ou Prontuário..." />
                </div>
                </div>
                <div className="col-md-4">
                <select className="form-select border-1">
                    <option>Todos os Convênios</option>
                    <option>Particular</option>
                    <option>Unimed</option>
                </select>
                </div>
            </div>
            </div>
        </div>

        {/* Tabela de Pacientes Profissional */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: "15px", overflow: "hidden" }}>
            <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                <tr>
                    <th className="ps-4 py-3 text-secondary small fw-bold">PACIENTE</th>
                    <th className="py-3 text-secondary small fw-bold">PRONTUÁRIO</th>
                    <th className="py-3 text-secondary small fw-bold">ÚLTIMA CONSULTA</th>
                    <th className="py-3 text-secondary small fw-bold">CONVÊNIO</th>
                    <th className="py-3 text-secondary small fw-bold text-center">AÇÕES</th>
                </tr>
                </thead>
                <tbody>
                {[1, 2, 3, 4].map((i) => (
                    <tr key={i} style={{ cursor: "pointer" }}>
                    <td className="ps-4">
                        <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold" 
                            style={{ width: "40px", height: "40px" }}>
                            JS
                        </div>
                        <div className="ms-3">
                            <div className="fw-bold mb-0" style={{ color: "#2C3E50" }}>José da Silva Sauro</div>
                            <small className="text-muted">65 anos • Masculino</small>
                        </div>
                        </div>
                    </td>
                    <td><span className="badge bg-light text-dark border">#098{i}</span></td>
                    <td className="text-muted small">12/05/2026</td>
                    <td><span className="badge rounded-pill bg-success-subtle text-success">Particular</span></td>
                    <td className="text-center">
                        <button className="btn btn-sm btn-outline-primary me-2">Abrir Prontuário</button>
                        <button className="btn btn-sm btn-light">⋮</button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
      </div>
    );
}    

export default Dashboard;