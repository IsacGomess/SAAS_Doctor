import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
});

// CSRF token armazenado somente em memória
let csrfToken = null;


// Carrega um novo CSRF token do backend
export const loadCsrfToken = async () => {
    try {
        const res = await api.get('/api/users/csrf-token');

        csrfToken = res.data?.csrfToken || null;

        return csrfToken;

    } catch (err) {
        console.error('[CSRF] failed to load token', err);

        csrfToken = null;

        return null;
    }
};


// Limpa o CSRF token da memória ao encerrar a sessão
export const clearCsrfToken = () => {
    csrfToken = null;
};


// Adiciona X-CSRF-Token automaticamente
// somente em requisições que alteram dados
api.interceptors.request.use(async (config) => {

    const method = (config.method || '').toLowerCase();

    const needsCsrf = [
        'post',
        'put',
        'patch',
        'delete'
    ].includes(method);

    const url = String(config.url || '');
    const shouldSkipCsrfBootstrap = [
        '/api/users/login',
        '/api/users/register',
        '/api/users/forgot-password',
        '/api/users/reset-password',
        '/api/users/refresh',
        '/api/users/csrf-token'
    ].some((path) => url.includes(path));

    if (needsCsrf && !csrfToken && !shouldSkipCsrfBootstrap) {
        try {
            await loadCsrfToken();
        } catch (_) {
            // Ignora bootstrap falho e deixa o backend responder normalmente.
        }
    }

    if (needsCsrf && csrfToken) {

        config.headers = config.headers || {};

        config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
});


// Interceptor responsável por renovar o accessToken
api.interceptors.response.use(

    (response) => response,

    async (error) => {

        const originalRequest = error.config;

        if (
            error.response?.status === 403 &&
            error.response?.data?.code === 'SUBSCRIPTION_REQUIRED'
        ) {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('subscription-required', {
                    detail: {
                        message: error.response?.data?.message || 'Assinatura necessária.'
                    }
                }));
            }
        }

        // Se o token CSRF expirou/faltou, tenta renovar e refaz a requisição uma vez.
        if (
            error.response?.status === 403 &&
            error.response?.data?.message === 'Requisição CSRF inválida.' &&
            originalRequest &&
            !originalRequest._csrfRetry
        ) {
            originalRequest._csrfRetry = true;

            try {
                await loadCsrfToken();
                return api(originalRequest);
            } catch (csrfError) {
                return Promise.reject(csrfError);
            }
        }

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry
        ) {

            originalRequest._retry = true;

            try {

                // Usa axios diretamente porque /refresh
                // não exige o CSRF token, apenas valida Origin
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/users/refresh`,
                    {},
                    {
                        withCredentials: true
                    }
                );

                // Refaz a requisição original.
                // Se for POST/PATCH/DELETE etc.,
                // o interceptor adicionará o CSRF novamente.
                return api(originalRequest);

            } catch (refreshError) {

                clearCsrfToken();

                localStorage.removeItem('user');

                window.location.href = '/login';

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);


export default api;