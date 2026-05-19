import { useNavigate } from "react-router-dom";
export function NavBar({userName}) {
    const navigate = useNavigate(); 
    return (
        <nav className="navbar"
            style={{ backgroundColor: '#F0F4F3', minHeight: '30px', position:'fixed', top:'0',left:'20%',width:'80%', borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
            <div className="container-fluid" style={{display:"flex", justifyContent:'space-between'}}>
                <span style={{fontSize:'18px',margin:'10px 0px 0px 10px'}}><p style={{fontSize:'14px' ,margin:'6px 0px 3px 5px'}}>Bem vindo,</p>
                    Dr<span style={{fontSize:'5px'}}>(a).</span>  {userName.toUpperCase()}
                    </span>
                <button
                    className="btn-sm bg-white text-dark fs-6 rounded-3"
                    onClick={() => navigate('/login')}>
                      <i className="bi bi-arrow-bar-right"></i>Sair
                </button>
            </div>
        </nav>
    );
}
