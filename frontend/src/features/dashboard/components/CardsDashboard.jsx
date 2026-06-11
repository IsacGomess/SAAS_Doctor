
export function CardsDashboard() {
    
    return (
        <>
         {/* Container principal ajustado para a sua estrutura de tela */}
        <div className="p-3" style={{  minHeight: '100%' }}>
            
            {/* ROW PRINCIPAL (Divide o espaço total em 12 partes) */}
            <div className="row g-4">
                
                {/* ------------------------------------------------------------- */}
                {/* COLUNA DA ESQUERDA: Ocupa 8 partes da tela (Cerca de 66%)       */}
                {/* ------------------------------------------------------------- */}
                <div className="col-12 col-lg-8 d-flex flex-column gap-3">
                    
                    {/* CARD 1: Visão Geral do Dia */}
                    <div className="card border-0 shadow-sm rounded-3 overflow-hidden" >
                        <div className="card-body" style={{ backgroundColor: '#1E6B65', color: 'white', padding: '24px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="card-title fs-5 fw-bold text-uppercase m-0">Visão Geral do Dia</h5>
                                <small className="opacity-75">ⓘ Dynâmico data</small>
                            </div>
                            
                            {/* Os 4 mini-quadrados internos */}
                            <div className="row g-3">
                                <div className="col-6 col-sm-3">
                                    <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                                        <small className="d-block text-truncate opacity-75 mb-1">Consultas <br /> Agendadas</small>
                                        <span className="fs-2 fw-bold">14</span>
                                    </div>
                                </div>
                                <div className="col-6 col-sm-3">
                                    <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                                        <small className="d-block text-truncate opacity-75 mb-1">Novos <br /> Pacientes</small>
                                        <span className="fs-2 fw-bold">4</span>
                                    </div>
                                </div>
                                <div className="col-6 col-sm-3">
                                    <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                                        <small className="d-block text-truncate opacity-75 mb-1">Confirmados</small>
                                        <span className="fs-2 fw-bold">11</span>
                                    </div>
                                </div>
                                <div className="col-6 col-sm-3">
                                    <div className="p-3 rounded-3" style={{ backgroundColor: '#FADBD8', color: '#78281F' }}>
                                        <small className="d-block text-truncate mb-1">Cancelamentos</small>
                                        <span className="fs-2 fw-bold">1</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 3: Agenda de Hoje (Mais alto e logo abaixo do card verde) */}
                    <div className="card border-0 shadow-sm rounded-3">
                        <div className="card-body" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="card-title fs-5 fw-bold text-uppercase m-0" style={{ color: '#2C3E50' }}>Agenda de Hoje</h5>
                                <select className="form-select form-select-sm w-auto">
                                    <option>Amoas</option>
                                </select> 
                            </div>

                            <div className="table-responsive">
                                <table className="table table-hover align-middle m-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Hora</th>
                                            <th>Paciente</th>
                                            <th>Tipo</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>08:00</td>
                                            <td><strong>Maria Santos</strong></td>
                                            <td>Pediátrica</td>
                                            <td><span className="badge bg-success-subtle text-success rounded-pill px-3 py-2">Confirmado</span></td>
                                        </tr>
                                        <tr>
                                            <td>08:30</td>
                                            <td><strong>Carlos Lima</strong></td>
                                            <td>Retorno</td>
                                            <td><span className="badge bg-warning-subtle text-warning rounded-pill px-3 py-2">Pendente</span></td>
                                        </tr>
                                        <tr>
                                            <td>10:15</td>
                                            <td><strong>Ana Costa</strong></td>
                                            <td>Pré-Natal</td>
                                            <td><span className="badge bg-success-subtle text-success rounded-pill px-3 py-2">Confirmado</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ------------------------------------------------------------- */}
                {/* COLUNA DA DIREITA: Ocupa 4 partes da tela (Cerca de 33%)        */}
                {/* ------------------------------------------------------------- */}
                <div className="col-12 col-lg-4 d-flex flex-column gap-4">
                    
                    {/* CARD 2: Alertas e Lembretes Importantes */}
                    <div className="card border-0 shadow-sm rounded-3" style={{minHeight:'290px'}}>
                        <div className="card-body" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                            <h5 className="card-title fs-6 fw-bold text-uppercase mb-4" style={{ color: '#2C3E50' }}>Alertas e Lembretes Importantes</h5>
                            
                            <ul className="list-unstyled d-flex flex-column gap-3 m-0" style={{ fontSize: '14px' }}>
                                <li className="d-flex gap-2">
                                    ⚠️ <span>Prontuário de Maria Santos pendente de assinatura.</span>
                                </li>
                                <li className="d-flex gap-2">
                                    ⚠️ <span>Exames pendentes para análise (Carlos Lima).</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* CARD 4: Status da Clínica (Fica abaixo dos alertas na direita) */}
                    <div className="card border-0 shadow-sm rounded-3">
                        <div className="card-body" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                            <div className="mb-4">
                                <h5 className="card-title fs-6 fw-bold text-uppercase m-0" style={{ color: '#2C3E50' }}>Status da Clínica</h5>
                                <small className="text-muted">(Últimos 7 dias)</small>
                            </div>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <small className="text-muted">Taxa de Ocupação</small>
                                    <strong style={{ color: '#1E6B65' }}>92%</strong>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                    <div className="progress-bar" style={{ width: '92%', backgroundColor: '#1E6B65' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="d-flex justify-content-between mb-1">
                                    <small className="text-muted">Pontualidade Média</small>
                                    <strong style={{ color: '#1E6B65' }}>97%</strong>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                    <div className="progress-bar" style={{ width: '97%', backgroundColor: '#1E6B65' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
        </>
    )
}