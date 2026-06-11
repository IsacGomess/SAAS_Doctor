/**
 * Utilitário para decodificar JWT sem biblioteca externa
 * Extrai informações do payload do token
 */

/**
 * Decodifica um token JWT e retorna o payload
 * @param {string} token - Token JWT
 * @returns {Object|null} Payload decodificado ou null se inválido
 */
export const decodeJWT = (token) => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.warn('Token JWT inválido - formato incorreto');
            return null;
        }

        // Decodifica a segunda parte (payload) do JWT
        const decoded = JSON.parse(
            atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
        );

        return decoded;
    } catch (error) {
        console.error('Erro ao decodificar JWT:', error);
        return null;
    }
};

/**
 * Obtém o ID do usuário do token armazenado
 * @returns {string|null} ID do usuário ou null
 */
export const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const decoded = decodeJWT(token);
    return decoded?.userId || null;
};

/**
 * Obtém o nome do usuário do token armazenado
 * @returns {string|null} Nome do usuário ou null
 */
export const getUserNameFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const decoded = decodeJWT(token);
    return decoded?.name || localStorage.getItem('userName') || null;
};

export const getUserClinicIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        // Fallback para clinicaId do localStorage se token não estiver disponível
        return localStorage.getItem('clinicaId') || null;
    }

    const decoded = decodeJWT(token);
    const clinicaId = decoded?.clinicaId || null;
    
    // Sincroniza com localStorage para consistência
    if (clinicaId) {
        localStorage.setItem('clinicaId', clinicaId);
    }
    
    return clinicaId;
};

/**
 * Verifica se o token está expirado
 * @returns {boolean} true se expirado, false caso contrário
 */
export const isTokenExpired = () => {
    const token = localStorage.getItem('token');
    if (!token) return true;

    const decoded = decodeJWT(token);
    if (!decoded?.exp) return false;

    // exp está em segundos, Date.now() em milissegundos
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
};

/**
 * Obtém a área da clínica do usuário (armazenada em localStorage)
 * Você pode expandir isso para extrair do token se necessário
 * @returns {string|null} Área da clínica ou null
 */
export const getClinicAreaFromStorage = () => {
    return localStorage.getItem('clinicArea') || null;
};

/**
 * Define a área da clínica no localStorage
 * @param {string} clinicArea - Identificador da área
 */
export const setClinicAreaInStorage = (clinicArea) => {
    localStorage.setItem('clinicArea', clinicArea);
};

/**
 * Obtém todas as informações do usuário do token
 * @returns {Object|null} Objeto com informações do usuário
 */
export const getUserInfoFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const decoded = decodeJWT(token);
    return decoded || null;
};
