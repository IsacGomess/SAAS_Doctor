import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080', 
    withCredentials: true // 🔒 OBRIGATÓRIO: Força o Axios a enviar e receber os cookies automaticamente
});

// 🔄 Interceptor de RESPOSTA (Garante o refresh estável e lida com expiração)
api.interceptors.response.use(
    (response) => {
        // Se a requisição foi bem-sucedida, apenas retorna a resposta normalmente
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Se a API retornou 401 (Não autorizado) e ainda não tentamos renovar o token nesta requisição
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Marca para não entrar em loop infinito se o refresh também falhar

            try {
                // Bate na rota de refresh que criamos no backend para atualizar o Cookie
                await axios.post('http://localhost:8080/api/users/refresh', {}, { withCredentials: true });
                
                // Se o refresh deu certo, o navegador já recebeu o novo cookie. 
                // Agora, refazemos a requisição original que tinha falhado!
                return api(originalRequest);
            } catch (refreshError) {
                // Se até o refresh falhar (ex: a sessão de 7 dias expirou), limpa o front e desloga
                console.warn('[AUTH] Sessão expirada completamente. Redirecionando...');
                
                localStorage.removeItem('user'); // Caso guarde dados cosméticos do user
                window.location.href = '/login'; // Joga o usuário de volta para a tela de login
                
                return Promise.reject(refreshError);
            }
        }

        // Se for qualquer outro erro (500, 404, 400), apenas passa o erro para frente
        return Promise.reject(error);
    }
);

export default api;