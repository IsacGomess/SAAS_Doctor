import { useNavigate} from "react-router-dom";

export function SelectorsDashboard() {
    const navigate = useNavigate();
    return (
        <>
        <div className="icone mt-3 d-flex justify-content-center" ><i class="bi bi-lungs"></i><p className="med">MED</p></div>
        <div className="position-btn bg-white d-flex justify-content-start flex-column align-items-center">
            <button type="button" className="btn btn-color-defaut m-1  fs-5 "><i class="bi bi-house-door ms-3 pe-2 "></i>Dashboard</button>
            <button type="button" className="btn btn-color-defaut m-1  fs-5 "><i class="bi bi-calendar2-plus ms-0 pe-4 "></i>Agenda</button>
            <button type="button" className="btn btn-color-defaut m-2  fs-5"><i class="bi bi-people me-2"></i> Pacientes</button>
            <button type="button" className="btn btn-color-defaut m-1  fs-5"><i class="bi bi-clipboard2-pulse mx-2"></i> Prontuarios</button>
            <button type="button" className="btn btn-color-defaut m-1  fs-5"> <i class="bi bi-bar-chart-line me-3 "></i> Relatorios</button>
            <button type="button" className="btn btn-color-defaut m-1 fs-5"> <i class="bi bi-gear ms-4"></i> Configuraçoes</button>
        </div>
        </>

    )
}