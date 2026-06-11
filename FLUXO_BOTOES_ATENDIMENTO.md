# 🔄 Fluxo Completo: "Continuar em Atendimento" vs "Finalizar Consulta"

---

## 📍 LOCALIZAÇÃO DOS BOTÕES

Arquivo: `frontend/src/features/medical-record/components/MedicalRecordPanel.jsx`

```jsx
// Linha 190
<button className="btn btn-sm btn-secondary" onClick={onClose} disabled={isSaving}>
  Continuar em Atendimento
</button>

// Linha 204
<button className="btn btn-sm btn-success" onClick={() => setShowConfirmation(true)} disabled={!hasChanges}>
  ✓ Finalizar Consulta
</button>
```

---

## 🔵 FLUXO 1: "CONTINUAR EM ATENDIMENTO"

### ❌ O que NÃO faz:
- **Não faz nada no backend**
- **Não atualiza nada na API**
- **Não altera o status do paciente**

### ✅ O que FAZ:
1. **Clique no botão**
   - Chama: `onClose()`

2. **onClose é passado por props**
   - De: `MedicalRecordPanel.jsx` (linha 10)
   - Para: `DoctorDashboard.jsx` (linha 121)
   
   ```jsx
   // DoctorDashboard.jsx linha 121
   <MedicalRecordPanel
     patient={waitingLine.selectedPatient}
     onFinishConsultation={waitingLine.handleFinishConsultation}
     onClose={waitingLine.clearSelection}  // ← onClose aqui
     isLoading={waitingLine.isLoading}
   />
   ```

3. **Função executada: `waitingLine.clearSelection()`**
   - Arquivo: `frontend/src/hooks/useWaitingLine.js` (linhas 214-216)
   
   ```javascript
   const clearSelection = useCallback(() => {
       setSelectedPatient(null);
   }, []);
   ```

4. **Resultado:**
   - ❌ Estado `selectedPatient` vira `null`
   - ❌ Painel de prontuário some (retorna estado vazio)
   - ❌ Paciente ainda permanece em `em_atendimento` no backend
   - ✅ Permite chamar próximo paciente sem salvar

### 📊 Fluxo Visual:
```
[CLIQUE] → onClose() → clearSelection() → setSelectedPatient(null) 
          → Painel desaparece (mostra "Selecione um paciente")
```

---

## 🟢 FLUXO 2: "FINALIZAR CONSULTA"

### 🚀 ETAPA 1: Modal de Confirmação

**Arquivo:** `MedicalRecordPanel.jsx`

1. **Clique no botão "Finalizar Consulta"**
   ```jsx
   // Linha 204
   onClick={() => setShowConfirmation(true)}
   ```

2. **Resultado:**
   - Modal aparece (linhas 217-245)
   - Mostra: `Tem certeza de que deseja finalizar a consulta de [Nome]?`
   - Pede confirmação porque é uma ação irreversível

---

### 🚀 ETAPA 2: Confirmação (Clique em "Confirmar Finalização")

**Arquivo:** `MedicalRecordPanel.jsx` (linhas 237-245)

```jsx
<button className="btn btn-success btn-sm" 
        onClick={handleFinishClick}
        disabled={isSaving}>
  Confirmar Finalização
</button>
```

**Função chamada:** `handleFinishClick()` (linhas 41-57)

```javascript
const handleFinishClick = async () => {
    // 1. Valida se há observações
    if (!evolution.trim()) {
        alert('Por favor, adicione uma observação/evolução antes de finalizar.');
        return;
    }

    setIsSaving(true);
    try {
        // 2. Chama o callback onFinishConsultation passando ID e observações
        await onFinishConsultation(patient._id, evolution);
        
        // 3. Limpa o estado local
        setEvolution('');
        setHasChanges(false);
        setShowConfirmation(false);
    } catch (error) {
        console.error('Erro ao finalizar consulta:', error);
        alert('Erro ao finalizar consulta. Tente novamente.');
    } finally {
        setIsSaving(false);
    }
};
```

---

### 🚀 ETAPA 3: Processamento no Hook useWaitingLine

**Arquivo:** `frontend/src/hooks/useWaitingLine.js` (linhas 182-204)

```javascript
const handleFinishConsultation = useCallback(async (entryId, observations = '') => {
    try {
        setError(null);
        
        // 1. Chama o serviço com ID do paciente e observações
        const response = await finishConsultation(entryId, observations);
        
        // 2. Verifica se resposta foi bem-sucedida
        if (response.success) {
            
            // 3. ATUALIZA A LISTA LOCAL
            setWaitingList(prev =>
                prev.map(entry =>
                    entry._id === entryId
                        ? { 
                            ...entry,                           // Copia paciente
                            status: 'finalizado',              // NOVO STATUS
                            completedAt: response.entry.completedAt,
                            observations 
                          }
                        : entry
                )
            );
            
            // 4. LIMPA A SELEÇÃO
            setSelectedPatient(null);  // Painel desaparece
            
            return response.entry;
        }
    } catch (err) {
        const errorMsg = err.message || 'Erro ao finalizar consulta';
        setError(errorMsg);
        throw err;
    }
}, []);
```

---

### 🚀 ETAPA 4: Chamada ao Serviço (API)

**Arquivo:** `frontend/src/features/waiting-line/services/waitingLineService.js` (linhas 143-152)

```javascript
export const finishConsultation = async (id, observations = '') => {
    // Chama updateWaitingLineStatus com:
    // - ID da entrada na fila
    // - status: 'finalizado'
    // - observations: texto da evolução
    
    return updateWaitingLineStatus(id, { 
        status: 'finalizado',
        observations 
    });
};
```

**Função auxiliar (linhas 98-105):**

```javascript
export const updateWaitingLineStatus = async (id, data) => {
    try {
        // REQUISIÇÃO: PATCH /api/waiting-line/:id/status
        const response = await api.patch(
            `${WAITING_LINE_BASE_URL}/${id}/status`, 
            data
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Erro ao atualizar status' };
    }
};
```

---

### 🚀 ETAPA 5: Backend (API)

**Endpoint:** `PATCH /api/waiting-line/:id/status`

**Payload enviado:**
```json
{
  "status": "finalizado",
  "observations": "texto da evolução digital..."
}
```

**O que o backend faz:**
1. ✅ Valida o token do usuário
2. ✅ Localiza a entrada na fila pelo ID
3. ✅ Atualiza `status` para `finalizado`
4. ✅ Salva `observations` (evolução da consulta)
5. ✅ Grava `completedAt` (timestamp da finalização)
6. ✅ Retorna a entrada atualizada

**Resposta do backend:**
```json
{
  "success": true,
  "entry": {
    "_id": "507f1f77bcf86cd799439011",
    "patientId": {...},
    "status": "finalizado",
    "observations": "Paciente apresentava...",
    "completedAt": "2026-05-31T14:35:22.000Z",
    "assignedTo": "doctor-id",
    "attendedAt": "2026-05-31T14:22:15.000Z",
    "calledAt": "2026-05-31T14:21:10.000Z",
    "checkInAt": "2026-05-31T14:20:00.000Z",
    ...
  }
}
```

---

### 🚀 ETAPA 6: Atualização da UI

**Arquivo:** `DoctorDashboard.jsx` (componentes envolvidos)

1. **Hook retorna sucesso**
   - `WaitingListPanel` é re-renderizado
   - Paciente com status `finalizado` é **REMOVIDO** da lista visível
   
   ```jsx
   // WaitingListPanel.jsx linha 25
   const visiblePatients = waitingList.filter(entry =>
       entry.status === 'aguardando' || entry.status === 'chamado'
   );
   // Filtra apenas "aguardando" ou "chamado"
   // Logo, "finalizado" desaparece da lista
   ```

2. **MedicalRecordPanel é esvaziado**
   - `selectedPatient` é `null`
   - Mostra: "Selecione um paciente em atendimento para visualizar o prontuário"

3. **Painel de prontuário desaparece**
   - Botões desativam
   - Textarea é limpo

---

## 📊 Comparação Visual

| Ação | Continuar em Atendimento | Finalizar Consulta |
|------|--------------------------|-------------------|
| **Clique** | `onClose()` | `setShowConfirmation(true)` |
| **Modal?** | ❌ Não | ✅ Sim (confirmação) |
| **Valida texto?** | ❌ Não | ✅ Sim (requer observação) |
| **Backend chamado?** | ❌ Não | ✅ Sim (PATCH API) |
| **Status alterado?** | ❌ Não | ✅ Sim (→ finalizado) |
| **Painel some?** | ✅ Sim | ✅ Sim |
| **Paciente na fila?** | ✅ Sim (`em_atendimento`) | ❌ Não (removido) |
| **Observação salva?** | ❌ Não | ✅ Sim (no BD) |

---

## 🔄 Fluxo de Dados - Diagrama

### Finalizar Consulta:
```
┌─────────────────────────────────────────────────────────────────┐
│ MedicalRecordPanel.jsx                                          │
│  - handleFinishClick()                                          │
│  - Valida evolution (texto)                                     │
│  - Chama onFinishConsultation(patientId, evolution)             │
└────────────────────┬────────────────────────────────────────────┘
                     │ Props via DoctorDashboard.jsx
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ useWaitingLine.js Hook                                          │
│  - handleFinishConsultation(entryId, observations)              │
│  - Chama finishConsultation() do serviço                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ waitingLineService.js                                           │
│  - finishConsultation(id, observations)                         │
│  - Chama updateWaitingLineStatus(id, {                          │
│      status: 'finalizado',                                      │
│      observations: ...                                          │
│    })                                                           │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ Backend API                                                     │
│  - PATCH /api/waiting-line/:id/status                           │
│  - Valida token                                                 │
│  - Salva status + observations + completedAt                    │
│  - Retorna entry atualizado                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │ Response {success: true, entry: {...}}
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ useWaitingLine.js                                               │
│  - setWaitingList() → atualiza entrada localmente               │
│  - setSelectedPatient(null) → limpa prontuário                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ React Re-render                                                 │
│  - WaitingListPanel filtra (remove status='finalizado')         │
│  - MedicalRecordPanel mostra estado vazio                       │
│  - Fila atualiza visualmente                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Segurança

**Token é enviado automaticamente:**
```javascript
// frontend/src/services/api.js (linhas 9-12)
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, ...);
```

Assim o backend pode validar quem está fazendo a requisição:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 Resumo das Mudanças de Estado

| Etapa | Componente | Estado | Valor Anterior | Valor Novo |
|-------|-----------|--------|-----------------|------------|
| 1 | MedicalRecordPanel | `showConfirmation` | `false` | `true` |
| 2 | MedicalRecordPanel | `isSaving` | `false` | `true` |
| 3 | useWaitingLine | (API Call) | - | Enviando... |
| 4 | useWaitingLine | `waitingList` | `status: 'em_atendimento'` | `status: 'finalizado'` |
| 5 | useWaitingLine | `selectedPatient` | `{...}` | `null` |
| 6 | WaitingListPanel | `visiblePatients` | Array com paciente | Array sem paciente |
| 7 | MedicalRecordPanel | (visual) | Painel ativo | Estado vazio |

---

## 🎯 Arquivos Envolvidos (Ordem de Execução)

### Frontend:
1. **`MedicalRecordPanel.jsx`** - Interfaz de finalização
2. **`DoctorDashboard.jsx`** - Organizador de componentes
3. **`useWaitingLine.js`** - Lógica de negócio e estado
4. **`waitingLineService.js`** - Chamadas HTTP
5. **`api.js`** - Cliente HTTP com interceptor
6. **`WaitingListPanel.jsx`** - Renderização da lista atualizada

### Backend:
7. **`waiting-line.routes.js`** - Define rota PATCH
8. **`waiting-line.controller.js`** - Lógica de atualizar
9. **`waiting-line.model.js`** - Schema e banco de dados
10. **`auth.js`** - Valida token JWT

---

## ✨ Diferenças-Chave

### "Continuar em Atendimento":
- ✅ **Local** - Só muda UI
- ✅ **Instantâneo** - Sem delay
- ✅ **Reversível** - Pode voltar
- ❌ **Sem persistência** - Não salva

### "Finalizar Consulta":
- 🌐 **API** - Salva no backend
- ⏱️ **Assíncrono** - Aguarda resposta
- ❌ **Irreversível** - Precisa de confirmação
- ✅ **Persistência** - Salva no BD

