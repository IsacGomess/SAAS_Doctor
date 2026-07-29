import { NavLink } from "react-router-dom";

export function SelectorsDashboard() {
    return (
        <>
            <div
                className="icone mt-3 d-flex justify-content-center align-items-center"
                style={{ backgroundColor: "#FFFFFF" }}
            >
                <i className="bi bi-lungs me-2"></i>
                <p className="med mb-0">MED</p>
            </div>

            <div className="position-btn bg-white d-flex flex-column align-items-center">

                <NavLink
                    to="/dashboard"
                    end
                    className={({ isActive }) =>
                        `btn btn-color-defaut m-1 fs-5 d-flex align-items-center w-100 ${isActive ? "activo" : ""}`
                    }
                >
                    <i className="bi bi-house-door icon-menu me-4"></i>
                    <span>Dashboard</span>
                </NavLink>

                <NavLink
                    to="/dashboard/clinica"
                    className={({ isActive }) =>
                        `btn btn-color-defaut m-1 fs-5 d-flex align-items-center w-100 ${isActive ? "activo" : ""}`
                    }
                >
                    <i className="bi bi-building icon-menu me-4"></i>
                    <span>Minha Clínica</span>
                </NavLink>

                <NavLink
                    to="waiting-line"
                    className={({ isActive }) =>
                        `btn btn-color-defaut m-1 fs-5 d-flex align-items-center w-100 ${isActive ? "activo" : ""}`
                    }
                >
                    <i className="bi bi-hourglass-split icon-menu me-4"></i>
                    <span>Fila de Espera</span>
                </NavLink>

                <NavLink
                    to="clinic-schedule"
                    className={({ isActive }) =>
                        `btn btn-color-defaut m-1 fs-5 d-flex align-items-center w-100 ${isActive ? "activo" : ""}`
                    }
                >
                    <i className="bi bi-calendar2-plus icon-menu me-4"></i>
                    <span>Agenda</span>
                </NavLink>

                <NavLink
                    to="patients"
                    className={({ isActive }) =>
                        `btn btn-color-defaut m-1 fs-5 d-flex align-items-center w-100 ${isActive ? "activo" : ""}`
                    }
                >
                    <i className="bi bi-people icon-menu me-4"></i>
                    <span>Pacientes</span>
                </NavLink>


                <NavLink
                    to="reports"
                    className={({ isActive }) =>
                        `btn btn-color-defaut m-1 fs-5 d-flex align-items-center w-100 ${isActive ? "activo" : ""}`
                    }
                >
                    <i className="bi bi-bar-chart-line icon-menu me-4"></i>
                    <span>Relatórios</span>
                </NavLink>

            </div>
        </>
    );
}