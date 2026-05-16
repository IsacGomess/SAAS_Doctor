import { useNavigate } from "react-router-dom";
export function NavBar({userName}) {
    const navigate = useNavigate(); 
    return (
        <nav className="navbar  "
            style={{ backgroundColor: '#FFFFFF', minHeight: '30px'}}>
            <div className="container-fluid" style={{display:"flex", justifyContent:'space-between'}}>
                <a className="navbar-brand " onClick={()=> navigate('/dashboard')}
                style={{color: '#e9ecef',textDecoration:'none',margin:'7px 7px' ,color:'#1E6B65' }}>
                MED Assistente 
                </a>
                <div style={{fontSize:'13px',margin:'7px'}}>Bem vindo ao MED!! Dr:(a)  {userName.toUpperCase()}</div>
                <button
                    className="btn"
                    onClick={() => navigate('/login')}
                    style={{ height:'22px', width:'50px',borderRadius:'15%', margin:'7px 10px', backgroundColor: '#FFFFFF'}}>
                      Sair
                </button>
            </div>
        </nav>
    );
}
