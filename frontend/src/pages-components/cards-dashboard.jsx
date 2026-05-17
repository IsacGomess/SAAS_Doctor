import {useNavigate} from 'react-router-dom'


export function CardsDashboard() {
    const navigate = useNavigate();
    return (
        <>
            <div className='d-flex flex-wrap gap-2 ms-auto' style={{ marginLeft:'22%', marginTop:'8%'}} >
                <div className="card "  style={{flex:'2 1 200px',width:'40%'}} >
                        <div className="card-body">
                            <h5 className="card-title">Card title</h5>
                            <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                            <a href="#" className="btn btn-primary">Go somewhere</a>
                        </div>
                </div>
                <div className="card " style={{flex:'1 1 150px', width:'20%'}} >
                    <div className="card-body">
                        <h5 className="card-title">Card title</h5>
                        <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                        <a href="#" className="btn btn-primary">Go somewhere</a>
                    </div>
                </div>
                
            </div>
        </>
    )
}