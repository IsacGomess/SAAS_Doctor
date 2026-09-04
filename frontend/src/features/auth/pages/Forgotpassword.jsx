import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if(loading) return;
    setLoading(true);
    

    try {
    const response = await api.post('/api/users/forgot-password', {
        email
    });

    setMessage(response.data.message);
    setSent(true);
    } catch (error) {
    setMessage('Não foi possível processar a solicitação.');
    } finally {
    setLoading(false);
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: "460px" }}>
      <h2 className="mb-3">Recuperar senha</h2>

      <p className="text-muted">
        Informe o e-mail cadastrado para receber o link de redefinição.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          className="form-control mb-3"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading || sent}
          className="btn btn-primary w-100"
          >
          {loading
              ? 'ENVIANDO...'
              : sent
                  ? 'LINK SOLICITADO'
                  : 'ENVIAR LINK'
          }
        </button>
      </form>

      {message && (
        <div className="alert alert-info mt-3">
          {message}
        </div>
      )}

      <button
        className="btn btn-link w-100 mt-2"
        onClick={() => navigate("/login")}
      >
        Voltar para o login
      </button>
    </div>
  );
}

export default ForgotPassword;