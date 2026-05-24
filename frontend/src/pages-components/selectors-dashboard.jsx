import { NavLink } from "react-router-dom";
export function SelectorsDashboard() {

    return (
        <>
        <div className="icone mt-3 d-flex justify-content-center " style={{backgroundColor:'#FFFFFF'}} ><i className="bi bi-lungs"></i><p className="med">MED</p></div>
        <div className="position-btn bg-white d-flex justify-content-start flex-column align-items-center">
            <NavLink to="/dashboard"  end className={({isActive}) => `btn btn-color-defaut m-1  fs-5 ${isActive ? 'activo': ''}`}>
                <i className="bi bi-house-door ms-3 pe-2 "></i>Dashboard
            </NavLink>
            <NavLink to="/dashboard/clinica"  className={({isActive}) => `btn btn-color-defaut m-1  fs-5 ${isActive ? 'activo': ''}`}>
                <i className="bi bi-building ms-2 pe-3 "></i>Minha Clínica
            </NavLink>
            <NavLink to="/doctor/waiting-line"  className={({isActive}) => `btn btn-color-defaut m-1  fs-5 ${isActive ? 'activo': ''}`}>
                <i className="bi bi-hourglass-split ms-2 pe-3 "></i>Fila de Espera
            </NavLink>
            <NavLink to="agenda"  className={({isActive}) => `btn btn-color-defaut m-1  fs-5 ${isActive ? 'activo': ''}`}>
                <i className="bi bi-calendar2-plus ms-0 pe-4 "></i>Agenda
            </NavLink>
            <NavLink to="patients"  className={({isActive}) => `btn btn-color-defaut m-2  fs-5 ${isActive ? 'activo': ''}`}  >
                <i className="bi bi-people me-2"></i> Pacientes
            </NavLink>
            <NavLink to="prontuarios"  className={({isActive}) => `btn btn-color-defaut m-1  fs-5 ${isActive ? 'activo': ''}`} >
                <i className="bi bi-clipboard2-pulse mx-2"></i> Prontuarios
            </NavLink>
            <NavLink to="relatorios" className={({isActive}) => `btn btn-color-defaut m-1  fs-5 ${isActive ? 'activo': ''}`} >
                <i className="bi bi-bar-chart-line me-3 "></i> Relatorios
            </NavLink>
            <NavLink to="configuracoes"  className={({isActive}) => `btn btn-color-defaut m-1 fs-5 ${isActive ? 'activo': ''}`}>
                <i className="bi bi-gear ms-4"></i> Configuraçoes
            </NavLink>
        </div>
        </>

    )
}