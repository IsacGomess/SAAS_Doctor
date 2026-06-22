/**
 * Obtém o objeto de usuário salvo no localStorage após o login
 * @returns {Object|null}
 */
const getUserFromStorage = () => {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

export const getUserIdFromToken = () => {
    return getUserFromStorage()?.userId || null;
};

export const getUserNameFromToken = () => {
    return getUserFromStorage()?.name || null;
};

export const getUserClinicIdFromToken = () => {
    return getUserFromStorage()?.clinicaId || null;
};

// O Axios agora cuida de renovar o token automaticamente quando expira, 
// então você não precisa mais calcular o tempo manualmente no front!
export const isTokenExpired = () => false; 

export const getClinicAreaFromStorage = () => {
    return localStorage.getItem('clinicArea') || null;
};

export const setClinicAreaInStorage = (clinicArea) => {
    localStorage.setItem('clinicArea', clinicArea);
};

export const getUserInfoFromToken = () => {
    return getUserFromStorage();
};
