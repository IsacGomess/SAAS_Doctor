import { useState, useEffect, useCallback } from 'react';
import api from '../services/api'; 

/**
 * Hook personalizado para gerenciar estado de autenticação
 * Centraliza acesso às informações do usuário logado usando Cookies e LocalStorage cosmético
 */
export const useAuth = () => {
    // 💡 Buscamos o ID do usuário de forma cosmética se necessário, ou podemos usar o ID da clínica
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
                // 🚀 MUDANÇA REAL: Lemos direto do LocalStorage os dados salvos no Login
                const storedName = localStorage.getItem('userName');
                const storedClinicId = localStorage.getItem('clinicaId');
                const storedArea = localStorage.getItem('clinicArea');

                if (!storedName) {
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }

                setUserName(storedName);
                setClinicaId(storedClinicId);
                setClinicArea(storedArea);
                
                // Como o cookie já está injetado pelo back, o front assume a autenticação
                setIsAuthenticated(true); 
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
            localStorage.setItem('clinicArea', area); // Salva direto no storage sem jwtUtils
            setClinicArea(area);
        }
    }, []);

    // Função de logout (Avisa o backend para limpar os cookies)
    const logout = useCallback(async () => {
        try {
            await api.post('/api/users/logout'); 
        } catch (error) {
            console.error('Erro ao limpar cookies no servidor durante o logout:', error);
        } finally {
            // Limpa o lixo eletrônico do localStorage
            localStorage.removeItem('token'); 
            localStorage.removeItem('userName');
            localStorage.removeItem('clinicArea');
            localStorage.removeItem('clinicaId');
            
            // Reseta estados do React
            setUserId(null);
            setUserName(null);
            setClinicArea(null);
            setClinicaId(null);
            setIsAuthenticated(false);
            
            window.location.href = '/login';
        }
    }, []);

    // Função para atualizar informações do usuário de forma reativa
    const refreshUserInfo = useCallback(() => {
        const storedName = localStorage.getItem('userName');
        const storedClinicId = localStorage.getItem('clinicaId');
        const storedArea = localStorage.getItem('clinicArea');

        setUserName(storedName);
        setClinicaId(storedClinicId);
        setClinicArea(storedArea);
        setIsAuthenticated(!!storedName);
    }, []);

    const getUserFullInfo = useCallback(() => {
        return {
            userId,
            userName,
            clinicArea,
            clinicaId,
            isAuthenticated,
            fullInfo: { name: userName, clinicaId } 
        };
    }, [userId, userName, clinicArea, clinicaId, isAuthenticated]);

    return {
        userId,
        userName,
        clinicaId,
        clinicArea,
        isAuthenticated,
        isLoading,
        setDoctorClinicArea,
        logout,
        refreshUserInfo,
        getUserFullInfo
    };
};
