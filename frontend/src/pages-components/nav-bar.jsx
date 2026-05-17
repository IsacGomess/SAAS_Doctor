import { useNavigate } from "react-router-dom";
export function NavBar({userName}) {
    const navigate = useNavigate(); 
    return (
        <nav className="navbar"
            style={{ backgroundColor: '#FFFFFF', minHeight: '30px', position:'fixed', top:'0',left:'20%',width:'80%', borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
            <div className="container-fluid" style={{display:"flex", justifyContent:'space-between'}}>
                <span style={{fontSize:'18px',margin:'10px 0px 0px 10px'}}><p style={{fontSize:'14px' ,margin:'6px 0px 3px 5px'}}>Bem vindo,</p>
                    Dr<span style={{fontSize:'5px'}}>(a).</span>  {userName.toUpperCase()}
                    </span>
                <button
                    className="btn"
                    onClick={() => navigate('/login')}
                    style={{ height:'22px', width:'50px',borderRadius:'15%', margin:'25px 10px 0px 0px', backgroundColor: '#FFFFFF'}}>
                      Sair
                </button>
            </div>
        </nav>
    );
}
