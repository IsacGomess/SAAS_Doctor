import { useState, useEffect, useCallback } from 'react';
import { 
    getUserIdFromToken, 
    getUserNameFromToken, 
    getUserClinicIdFromToken,
    getClinicAreaFromStorage, 
    setClinicAreaInStorage,
    isTokenExpired,
    getUserInfoFromToken
} from '../utils/jwtUtils';

/**
 * Hook personalizado para gerenciar estado de autenticação
 * Centraliza acesso às informações do usuário logado
 * 
 * @returns {Object} Objeto com informações do usuário e métodos
 */
export const useAuth = () => {
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState(null);
    const [clinicArea, setClinicArea] = useState(null);
    const [clinicaId, setClinicaId] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Inicializa o estado de autenticação ao montar o componente
    useEffect(() => {
        const initializeAuth = () => {
            try {
                // Verifica se token está armazenado
                const token = localStorage.getItem('token');
                
                if (!token || isTokenExpired()) {
                    setIsAuthenticated(false);
                    localStorage.removeItem('token');
                    localStorage.removeItem('userName');
                    setIsLoading(false);
                    return;
                }

                // Extrai informações do token
                const id = getUserIdFromToken();
                const name = getUserNameFromToken();
                const clinicId = getUserClinicIdFromToken();
                const area = getClinicAreaFromStorage();

                setUserId(id);
                setUserName(name);
                setClinicaId(clinicId);
                setClinicArea(area);
                setIsAuthenticated(!!id);
            } catch (error) {
                console.error('Erro ao inicializar autenticação:', error);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    // Função para definir a área da clínica
    const setDoctorClinicArea = useCallback((area) => {
        if (area) {
            setClinicAreaInStorage(area);
            setClinicArea(area);
        }
    }, []);

    // Função para logout
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('clinicArea');
        localStorage.removeItem('clinicaId');
        setUserId(null);
        setUserName(null);
        setClinicArea(null);
        setClinicaId(null);
        setIsAuthenticated(false);
    }, []);

    // Função para atualizar informações do usuário
    const refreshUserInfo = useCallback(() => {
        const id = getUserIdFromToken();
        const name = getUserNameFromToken();
        const clinicId = getUserClinicIdFromToken();
        const area = getClinicAreaFromStorage();

        setUserId(id);
        setUserName(name);
        setClinicaId(clinicId);
        setClinicArea(area);
        setIsAuthenticated(!!id);
    }, []);

    // Função para obter todas as informações do usuário
    const getUserFullInfo = useCallback(() => {
        return {
            userId,
            userName,
            clinicArea,
            clinicaId,
            isAuthenticated,
            fullInfo: getUserInfoFromToken()
        };
    }, [userId, userName, clinicArea, clinicaId, isAuthenticated]);

    return {
        // Estado
        userId,
        userName,
        clinicaId,
        clinicArea,
        isAuthenticated,
        isLoading,

        // Métodos
        setDoctorClinicArea,
        logout,
        refreshUserInfo,
        getUserFullInfo
    };
};
