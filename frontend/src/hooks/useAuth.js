import { useState, useEffect, useCallback } from 'react';
import api, { loadCsrfToken, clearCsrfToken } from '../services/api'; 

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
        const initializeAuth = async () => {
            try {
                // Tenta validar sessão no servidor usando cookie (credentials: include)
                const res = await fetch('/api/users/me', { credentials: 'include' });
                if (res.ok) {
                    const json = await res.json();
                    const u = json.user || {};
                    const effectiveRegistroProf = u.registroProf || u.numeroRegistroProfissional || '';
                    let clinicName = u.clinicName || u.clinicaName || '';

                    if (u.clinicaId) {
                        localStorage.setItem('clinicaId', u.clinicaId);
                        try {
                            const clinicResponse = await fetch('/api/clinics/me', { credentials: 'include' });
                            if (clinicResponse.ok) {
                                const clinicJson = await clinicResponse.json();
                                clinicName = clinicJson?.clinica?.name || clinicName;
                            }
                        } catch (err) {
                            console.warn('[AUTH] falha ao buscar nome da clínica para a navbar');
                        }
                    }

                    if (u.name) localStorage.setItem('userName', u.name);
                    if (u.role) localStorage.setItem('role', u.role);
                    if (effectiveRegistroProf) localStorage.setItem('registroProf', effectiveRegistroProf);
                    else localStorage.removeItem('registroProf');
                    if (u._id) localStorage.setItem('userId', u._id);
                    if (clinicName) localStorage.setItem('clinicName', clinicName);
                    else localStorage.removeItem('clinicName');

                    setUserName(u.name || localStorage.getItem('userName'));
                    setClinicaId(u.clinicaId || localStorage.getItem('clinicaId'));
                    setClinicArea(localStorage.getItem('clinicArea'));
                    setUserId(u._id || null);
                    setIsAuthenticated(!!(u.name || localStorage.getItem('userName')));

                    // Após confirmar sessão válida, restaura CSRF em memória
                    try {
                        await loadCsrfToken();
                    } catch (err) {
                        console.warn('[CSRF] falha ao restaurar token na inicialização');
                    }

                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                // Falha ao contatar servidor, faremos fallback para storage
            }

            // Fallback: usa dados cosméticos do localStorage sem garantir sessão
            try {
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
                setIsAuthenticated(true);
            } catch (err) {
                console.error('Erro ao inicializar autenticação:', err);
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
            // Limpa CSRF em memória no cliente
            try {
                clearCsrfToken();
            } catch (err) {
                console.warn('[CSRF] falha ao limpar token localmente', err);
            }
        } catch (error) {
            console.error('Erro ao limpar cookies no servidor durante o logout:', error);
        } finally {
            // Limpa o lixo eletrônico do localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('userName');
            localStorage.removeItem('clinicArea');
            localStorage.removeItem('clinicaId');
            localStorage.removeItem('clinicName');
            localStorage.removeItem('registroProf');

            // Reseta estados do React
            setUserId(null);
            setUserName(null);
            setClinicArea(null);
            setClinicaId(null);
            setIsAuthenticated(false);

            window.location.href = '/';
        }
    }, []);

    // Função para atualizar informações do usuário de forma reativa
    const refreshUserInfo = useCallback(async () => {
        try {
            // Primeiro tenta recuperar informações do servidor (cookie de sessão)
            const res = await fetch('/api/users/me', { credentials: 'include' });
            if (res.ok) {
                const json = await res.json();
                const u = json.user || {};
                const effectiveRegistroProf = u.registroProf || u.numeroRegistroProfissional || '';
                let clinicName = u.clinicName || u.clinicaName || '';
                if (u.name) {
                    localStorage.setItem('userName', u.name);
                }
                if (u.clinicaId) {
                    localStorage.setItem('clinicaId', u.clinicaId);
                    try {
                        const clinicResponse = await fetch('/api/clinics/me', { credentials: 'include' });
                        if (clinicResponse.ok) {
                            const clinicJson = await clinicResponse.json();
                            clinicName = clinicJson?.clinica?.name || clinicName;
                        }
                    } catch (err) {
                        console.warn('[AUTH] falha ao atualizar nome da clínica para a navbar');
                    }
                }
                if (u.role) {
                    localStorage.setItem('role', u.role);
                }
                if (effectiveRegistroProf) {
                    localStorage.setItem('registroProf', effectiveRegistroProf);
                } else {
                    localStorage.removeItem('registroProf');
                }
                if (u._id) {
                    localStorage.setItem('userId', u._id);
                }
                if (clinicName) {
                    localStorage.setItem('clinicName', clinicName);
                } else {
                    localStorage.removeItem('clinicName');
                }

                setUserName(u.name || localStorage.getItem('userName'));
                setClinicaId(u.clinicaId || localStorage.getItem('clinicaId'));
                setClinicArea(localStorage.getItem('clinicArea'));
                setIsAuthenticated(!!(u.name || localStorage.getItem('userName')));
                setUserId(u._id || null);
                return;
            }
        } catch (err) {
            // fallback para leitura do localStorage
        }

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
