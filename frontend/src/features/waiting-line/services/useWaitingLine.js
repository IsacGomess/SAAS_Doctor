import { useState, useEffect, useCallback, useRef } from 'react';
import { 
    getWaitingLine, 
    getWaitingLineById, 
    callPatient, 
    startAttendance, 
    finishConsultation,
    cancelWaitingLine
} from './waitingLineService';

/**
 * Hook personalizado para gerenciar a fila de espera
 * Implementa polling automático e gerencia estado da lista
 * 
 * @param {Object} options - Opções de configuração
 * @param {number} options.pollInterval - Intervalo de polling em ms (padrão: 15000ms = 15s)
 * @param {string} options.clinicArea - Área da clínica para filtrar
 * @param {string} options.status - Status para filtrar (padrão: 'aguardando,chamado')
 * @returns {Object} Estado e métodos para gerenciar a fila
 */
export const useWaitingLine = (options = {}) => {
    const {
        pollInterval = 15000, // 15 segundos por padrão
        clinicArea = null,
        status = null,
        assignedUserId = null
    } = options;

    // Estado
    const [waitingList, setWaitingList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isPolling, setIsPolling] = useState(pollInterval !== null && pollInterval > 0);

    // Referência para o intervalo (para limpeza)
    const pollingIntervalRef = useRef(null);

    // =========================================================================
    // FETCH - Busca a fila de espera
    // =========================================================================
    const fetchWaitingLine = useCallback(async () => {
        setIsLoading(true);
        try {
            setError(null);
            
            // Monta os filtros
            const filters = {};
            if (clinicArea) filters.clinicArea = clinicArea;
            if (status) filters.status = status;

            const response = await getWaitingLine(filters);
            
            if (response.success && response.waitingLine) {
                setWaitingList(response.waitingLine);
            } else {
                setWaitingList([]);
            }
        } catch (err) {
            console.error('Erro ao buscar fila de espera:', err);
            setError(err.message || 'Erro ao carregar fila de espera');
            setWaitingList([]);
        } finally {
            setIsLoading(false);
        }
    }, [clinicArea, status]);

    // =========================================================================
    // POLLING - Atualiza a lista automaticamente em intervalos
    // =========================================================================
    useEffect(() => {
        const shouldUsePolling = pollInterval !== null && pollInterval > 0;

        if (!shouldUsePolling) {
            fetchWaitingLine();
            return;
        }

        if (!isPolling) return;

        // Busca inicial
        fetchWaitingLine();

        // Configura polling automático
        pollingIntervalRef.current = setInterval(fetchWaitingLine, pollInterval);

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [fetchWaitingLine, pollInterval, isPolling]);

    // =========================================================================
    // CHAMAR PACIENTE
    // =========================================================================
    const handleCallPatient = useCallback(async (entryId) => {
        try {
            setError(null);
            const response = await callPatient(entryId);
            
            if (response.success) {
                // Atualiza o paciente na lista
                setWaitingList(prev =>
                    prev.map(entry =>
                        entry._id === entryId
                            ? { ...entry, status: 'chamado', calledAt: response.entry.calledAt }
                            : entry
                    )
                );

                // Limpa seleção anterior e seleciona apenas o nome do paciente
                const minimalSelection = {
                    _id: entryId,
                    patientId: {
                        name: response.entry?.patientId?.name || 'Paciente'
                    },
                    status: 'chamado'
                };
                // remove qualquer seleção prévia para garantir limpeza total da tela direita
                setSelectedPatient(null);
                // define seleção mínima (somente nome)
                setSelectedPatient(minimalSelection);
                return response.entry;
            }
        } catch (err) {
            const errorMsg = err.message || 'Erro ao chamar paciente';
            setError(errorMsg);
            throw err;
        }
    }, []);

    // Remover/Cancelar entrada da fila
    const handleRemoveEntry = useCallback(async (entryId, reason = 'removido_por_usuario') => {
        try {
            setError(null);
            const response = await cancelWaitingLine(entryId, reason);

            if (response.success) {
                setWaitingList(prev => prev.filter(entry => entry._id !== entryId));
                if (selectedPatient && selectedPatient._id === entryId) {
                    setSelectedPatient(null);
                }
                return response.entry;
            }
        } catch (err) {
            const errorMsg = err.message || 'Erro ao remover entrada';
            setError(errorMsg);
            throw err;
        }
    }, [selectedPatient]);

    // =========================================================================
    // INICIAR ATENDIMENTO
    // =========================================================================
    const handleStartAttendance = useCallback(async (entryId) => {
        try {
            setError(null);
            const response = await startAttendance(entryId, assignedUserId);
            
            if (response.success) {
                // Atualiza o paciente na lista
                const updatedEntry = response.entry;
                setWaitingList(prev =>
                    prev.map(entry =>
                        entry._id === entryId
                            ? { ...entry, status: 'em_atendimento', attendedAt: updatedEntry.attendedAt, assignedTo: updatedEntry.assignedTo }
                            : entry
                    )
                );
                setSelectedPatient(updatedEntry);
                return updatedEntry;
            }
        } catch (err) {
            const errorMsg = err.message || 'Erro ao iniciar atendimento';
            setError(errorMsg);
            throw err;
        }
    }, [assignedUserId]);

    // =========================================================================
    // FINALIZAR CONSULTA
    // =========================================================================
    const handleFinishConsultation = useCallback(async (entryId, observations = '') => {
        try {
            setError(null);
            const response = await finishConsultation(entryId, observations);
            
            if (response.success) {
                // Remove o paciente da lista ou marca como finalizado
                setWaitingList(prev =>
                    prev.map(entry =>
                        entry._id === entryId
                            ? { ...entry, status: 'finalizado', completedAt: response.entry.completedAt, observations }
                            : entry
                    )
                );
                setSelectedPatient(null);
                return response.entry;
            }
        } catch (err) {
            const errorMsg = err.message || 'Erro ao finalizar consulta';
            setError(errorMsg);
            throw err;
        }
    }, []);

    // =========================================================================
    // SELECIONAR PACIENTE
    // =========================================================================
    const handleSelectPatient = useCallback(async (entryId) => {
        try {
            setError(null);
            const response = await getWaitingLineById(entryId);
            
            if (response.success) {
                setSelectedPatient(response.entry);
                return response.entry;
            }
        } catch (err) {
            const errorMsg = err.message || 'Erro ao buscar detalhes do paciente';
            setError(errorMsg);
            throw err;
        }
    }, []);

    // =========================================================================
    // LIMPAR SELEÇÃO
    // =========================================================================
    const clearSelection = useCallback(() => {
        setSelectedPatient(null);
    }, []);

    // =========================================================================
    // PAUSAR/RETOMAR POLLING
    // =========================================================================
    const togglePolling = useCallback((shouldPoll) => {
        setIsPolling(shouldPoll);
    }, []);

    // =========================================================================
    // FILTRAR LISTA LOCALMENTE
    // =========================================================================
    const getFilteredList = useCallback((filterStatus) => {
        if (!filterStatus) return waitingList;
        
        if (Array.isArray(filterStatus)) {
            return waitingList.filter(entry => filterStatus.includes(entry.status));
        }
        
        return waitingList.filter(entry => entry.status === filterStatus);
    }, [waitingList]);

    return {
        // Estado
        waitingList,
        selectedPatient,
        isLoading,
        error,
        isPolling,

        // Métodos
        fetchWaitingLine,
        handleCallPatient,
        handleStartAttendance,
        handleFinishConsultation,
        handleRemoveEntry,
        handleSelectPatient,
        clearSelection,
        togglePolling,
        getFilteredList,

        // Utilitários
        getWaitingCount: () => waitingList.length,
        getPriorityCount: (priority) => 
            waitingList.filter(entry => entry.priority === priority).length,
        getStatusCount: (status) => 
            waitingList.filter(entry => entry.status === status).length
    };
};
