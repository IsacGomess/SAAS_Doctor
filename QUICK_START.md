# 🚀 Guia Rápido - Sistema de Fila de Espera

## ⚡ Quick Start (5 minutos)

### 1️⃣ Backend - Registrar Rotas

Abra `backend/server.js` e procure pela linha com outras rotas (por volta de `app.use('/api/users'...)`).

Adicione logo depois:

```javascript
const waitingLineRoutes = require('./routes/waiting-line');
app.use('/api/waiting-line', waitingLineRoutes);
```

✅ Pronto! Backend está configurado.

### 2️⃣ Frontend - Teste Imediato

Navegue para:
```
http://localhost:3000/doctor/waiting-line
```

Depois faça login como médico.

---

## 📂 Arquivos Criados

| Arquivo | Tipo | Localização |
|---------|------|------------|
| `waitingLineService.js` | Serviço API | `src/services/` |
| `jwtUtils.js` | Utilidade | `src/utils/` |
| `useAuth.js` | Hook | `src/hooks/` |
| `useWaitingLine.js` | Hook | `src/hooks/` |
| `WaitingListPanel.jsx` | Componente | `src/pages-components/` |
| `WaitingListPanel.css` | Estilos | `src/pages-components/` |
| `MedicalRecordPanel.jsx` | Componente | `src/pages-components/` |
| `MedicalRecordPanel.css` | Estilos | `src/pages-components/` |
| `DoctorDashboard.jsx` | Página | `src/pages/` |
| `DoctorDashboard.css` | Estilos | `src/pages/` |
| `App.jsx` | Atualizado | Adicionada rota `/doctor/waiting-line` |

---

## 🎯 O que Cada Componente Faz

### `waitingLineService.js`
Centraliza todas as chamadas HTTP para a API de Waiting Line:
- `getWaitingLine()` - Busca fila com filtros
- `callPatient()` - Chama paciente
- `startAttendance()` - Inicia atendimento
- `finishConsultation()` - Finaliza com observações

### `useAuth.js` Hook
Gerencia autenticação do usuário:
```javascript
const auth = useAuth();
auth.userName;           // Nome do médico
auth.clinicArea;         // Área de atuação
auth.setDoctorClinicArea('Cardiologia');
auth.logout();
```

### `useWaitingLine.js` Hook
Gerencia fila com **polling automático a cada 15 segundos**:
```javascript
const wl = useWaitingLine({ clinicArea: 'Pediatria' });
wl.waitingList;                        // Array de pacientes
wl.handleCallPatient(id);              // Chama paciente
wl.handleStartAttendance(id);          // Inicia atendimento
wl.handleFinishConsultation(id, obs);  // Finaliza consulta
```

### `WaitingListPanel.jsx`
Lista de pacientes aguardando/chamados:
- Mostra fila com números sequenciais
- Badges de prioridade (Normal/Prioritário/Emergência)
- Botões "Chamar" e "Iniciar Atendimento"
- Atualiza em tempo real

### `MedicalRecordPanel.jsx`
Prontuário do paciente em atendimento:
- Dados do paciente
- Campo de evolução/observações
- Botão "Finalizar Consulta"
- Confirmação antes de salvar

### `DoctorDashboard.jsx`
Layout principal com 2 colunas:
- Esquerda: Lista de fila
- Direita: Prontuário
- Modal para selecionar área da clínica
- Indicator de polling ativo

---

## 📊 Fluxo de Dados

```
Médico acessa /doctor/waiting-line
        ↓
useAuth() busca info do usuário no token
        ↓
useWaitingLine() inicia polling a cada 15s
        ↓
WaitingListPanel renderiza lista
        ↓
Médico clica "Chamar" → handleCallPatient()
        ↓
Médico clica "Iniciar" → handleStartAttendance()
        ↓
MedicalRecordPanel abre (status = em_atendimento)
        ↓
Médico escreve evolução
        ↓
Médico clica "Finalizar" → handleFinishConsultation()
        ↓
API atualiza status para 'finalizado'
        ↓
Paciente sai da fila
```

---

## 🔐 Fluxo de Autenticação

1. Token JWT armazenado em `localStorage.token`
2. `useAuth()` decodifica o token e extrai:
   - `userId`
   - `userName`
   - `clinicArea` (armazenado em localStorage)
3. Interceptor `api.js` injeta automaticamente header:
   ```
   Authorization: Bearer {token}
   ```
4. Todas as requisições saem com autenticação ✅

---

## 🎨 Cores do Design

| Cor | Uso |
|-----|-----|
| `#1E6B65` | Primária (botões, headers) |
| `#155350` | Escura (hover, gradientes) |
| `#F0F4F3` | Background clara |
| `#51CF66` | Success (polling ativo) |
| `#F39C12` | Warning (prioritário) |
| `#E74C3C` | Danger (emergência) |

---

## ⚙️ Configurações Importantes

### Intervalo de Polling (atualmente 15s)

Para alterar, edite `DoctorDashboard.jsx`:

```javascript
const waitingLine = useWaitingLine({
  pollInterval: 10000,  // 10 segundos
  clinicArea: auth.clinicArea
});
```

### Área da Clínica

Armazenada em `localStorage.clinicArea` após primeira seleção.

Para resetar:
```javascript
localStorage.removeItem('clinicArea');
```

---

## 🧪 Teste Rápido

### Criar entrada de teste (via curl)

```bash
curl -X POST http://localhost:8080/api/waiting-line/create \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "ID_PACIENTE_AQUI",
    "priority": "normal",
    "clinicArea": "Pediatria"
  }'
```

### Listar fila
```bash
curl http://localhost:8080/api/waiting-line/list \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## ❌ Se Algo Não Funcionar

### 1. Verifique se backend registrou a rota
```bash
# Backend deve exibir:
# "GET  /api/waiting-line/list"
# "POST /api/waiting-line/create"
# etc.
```

### 2. Abra DevTools (F12)
- Aba **Network**: veja requisições HTTP
- Aba **Console**: veja erros JavaScript
- Aba **Storage**: veja localStorage.token

### 3. Procure por erros comuns
```
❌ "Cannot read property 'waitingList'"
✅ Solução: useWaitingLine() ainda carregando

❌ "401 Unauthorized"
✅ Solução: Token expirado, faça login novamente

❌ "Nenhum paciente na fila"
✅ Solução: Crie pacientes com clinicArea correta
```

---

## 🎓 Exemplos de Uso

### Hook no seu componente
```javascript
import { useWaitingLine } from '../hooks/useWaitingLine';

function MeuComponente() {
  const wl = useWaitingLine();

  return (
    <div>
      <p>Total: {wl.getWaitingCount()}</p>
      {wl.waitingList.map(p => (
        <button key={p._id} onClick={() => wl.handleCallPatient(p._id)}>
          {p.patientId.name}
        </button>
      ))}
    </div>
  );
}
```

### Serviço direto (sem hook)
```javascript
import { getWaitingLine, callPatient } from '../services/waitingLineService';

async function chamarPrimeiro() {
  const res = await getWaitingLine();
  const id = res.waitingLine[0]._id;
  await callPatient(id);
}
```

---

## 📞 Resumo dos Endpoints

| Método | Rota | Função |
|--------|------|--------|
| POST | `/create` | Criar entrada |
| GET | `/list` | Listar fila (com filtros) |
| GET | `/{id}` | Detalhes de um paciente |
| PATCH | `/{id}/call` | Chamar paciente |
| PATCH | `/{id}/status` | Atualizar status |
| PATCH | `/{id}/cancel` | Cancelar entrada |

---

## ✅ Checklist Final

Antes de considerar pronto:

- [ ] Backend registrou rotas (arquivo `server.js`)
- [ ] Acessar `/doctor/waiting-line` funciona
- [ ] Login com token válido
- [ ] Selecionar área da clínica
- [ ] Lista de pacientes aparece (ou "sem pacientes")
- [ ] Botão "Chamar" funciona
- [ ] Botão "Iniciar Atendimento" abre prontuário
- [ ] Campo de evolução é preenchível
- [ ] "Finalizar Consulta" salva e fecha
- [ ] Lista atualiza a cada 15 segundos

---

## 📖 Leitura Recomendada

1. **WAITING_LINE_README.md** - Guia completo
2. **EXAMPLES_USAGE.js** - Códigos de exemplo
3. **IMPLEMENTATION_CHECKLIST.md** - Todos os passos

---

**Status:** ✅ Pronto para usar
**Criado:** 23 de Maio de 2026
