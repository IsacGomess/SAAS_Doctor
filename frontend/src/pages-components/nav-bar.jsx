import { useNavigate } from "react-router-dom";
export function NavBar() {
    const navigate = useNavigate(); 
    return (
        <nav className="navbar  "
            style={{ backgroundColor: '#0F172A', minHeight: '30px'}}>
            <div className="container-fluid" style={{display:"flex", justifyContent:'space-between'}}>
                <a className="navbar-brand " 
                style={{color: '#e9ecef',textDecoration:'none'}}>
                M. A.
                </a>
                <button
                    className="btn"
                    onClick={() => navigate('/login')}
                    style={{ height:'18px', marginTop:'5px' }}>
                    saida
                </button>
            </div>
        </nav>
    );
}
