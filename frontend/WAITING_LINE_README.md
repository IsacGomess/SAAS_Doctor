# Sistema de Fila de Espera - Frontend React

## 📋 Visão Geral

Implementação completa do frontend para gerenciamento de fila de espera em consultório médico. O sistema permite que médicos visualizem pacientes aguardando, chamem para atendimento e registrem a evolução durante a consulta.

---

## 🏗️ Arquitetura

### Estrutura de Pastas

```
frontend/src/
├── pages/
│   ├── DoctorDashboard.jsx          # Página principal do médico
│   ├── DoctorDashboard.css          # Estilos do dashboard
│   └── ...
├── pages-components/
│   ├── WaitingListPanel.jsx         # Componente de lista de fila
│   ├── WaitingListPanel.css         # Estilos da lista
│   ├── MedicalRecordPanel.jsx       # Componente de prontuário
│   ├── MedicalRecordPanel.css       # Estilos do prontuário
│   └── ...
├── hooks/
│   ├── useAuth.js                   # Hook para autenticação
│   └── useWaitingLine.js            # Hook para gerenciar fila
├── services/
│   ├── api.js                       # Instância Axios com interceptor
│   ├── waitingLineService.js        # Serviço de Waiting Line
│   └── ...
├── utils/
│   ├── jwtUtils.js                  # Utilitários para JWT
│   └── ...
└── ...
```

---

## 🚀 Como Usar

### 1. **Acessar o Dashboard**

Após fazer login como médico, navegue para:
```
http://localhost:3000/doctor/waiting-line
```

### 2. **Definir Área da Clínica**

Ao acessar pela primeira vez, será solicitado definir a área de atuação (ex: Pediatria, Cardiologia).

> ⚠️ **Importante**: A área é armazenada em `localStorage` e filtra automaticamente os pacientes dessa unidade.

### 3. **Gerenciar Fila de Espera**

#### **Coluna Esquerda - Lista de Pacientes**

Exibe pacientes com status `aguardando` ou `chamado`:

- **Botão "Chamar"**: Muda status para `chamado` e registra hora
- **Botão "Iniciar Atendimento"**: Muda para `em_atendimento` e abre prontuário

#### **Coluna Direita - Prontuário**

Aparece quando paciente está em `em_atendimento`:

- Exibe informações do paciente
- Campo de texto para **Evolução / Observações**
- Botão **"Finalizar Consulta"**: Registra a evolução e encerra atendimento

### 4. **Polling Automático**

A lista atualiza automaticamente a cada **15 segundos** (configurável).

---

## 🔌 API Endpoints Utilizados

### GET - Listar Fila
```
GET /api/waiting-line/list?status=aguardando&clinicArea=Pediatria
```

**Filtros Opcionais:**
- `status`: aguardando, chamado, em_atendimento, finalizado, cancelado
- `priority`: normal, prioritario, emergencia
- `flowStage`: recepcao, triagem, espera, consulta, retorno, internacao
- `clinicArea`: identificador da área

**Resposta:**
```json
{
  "success": true,
  "count": 5,
  "waitingLine": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "patientId": { "name": "João Silva", "phone": "11999999999" },
      "lineNumber": 1,
      "status": "aguardando",
      "priority": "normal",
      "clinicArea": "Pediatria",
      "checkInAt": "2026-05-23T10:30:00Z",
      ...
    }
  ]
}
```

### PATCH - Chamar Paciente
```
PATCH /api/waiting-line/{id}/call
```

### PATCH - Iniciar Atendimento
```
PATCH /api/waiting-line/{id}/status
Body: { "status": "em_atendimento" }
```

### PATCH - Finalizar Consulta
```
PATCH /api/waiting-line/{id}/status
Body: { 
  "status": "finalizado", 
  "observations": "Paciente apresenta sintomas de gripe..." 
}
```

---

## 🔐 Autenticação

### Interceptor JWT

O serviço `api.js` injeta automaticamente o token JWT em todas as requisições:

```javascript
// Automaticamente adicionado em cada request
headers: {
  'Authorization': 'Bearer {token}'
}
```

O token é obtido de `localStorage.getItem('token')` após login.

---

## 🎨 Componentes Principais

### `useAuth()` - Hook de Autenticação

```javascript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const auth = useAuth();
  
  // Estado
  console.log(auth.userId);           // ID do usuário
  console.log(auth.userName);         // Nome do usuário
  console.log(auth.clinicArea);       // Área da clínica
  console.log(auth.isAuthenticated);  // Booleano
  
  // Métodos
  auth.setDoctorClinicArea('Cardiologia');
  auth.logout();
  auth.refreshUserInfo();
}
```

### `useWaitingLine()` - Hook da Fila

```javascript
import { useWaitingLine } from '../hooks/useWaitingLine';

function MyComponent() {
  const waitingLine = useWaitingLine({
    pollInterval: 15000,        // ms entre atualizações
    clinicArea: 'Pediatria',    // Filtrar por área
    status: 'aguardando'        // Filtrar por status (opcional)
  });
  
  // Estado
  console.log(waitingLine.waitingList);      // Array de pacientes
  console.log(waitingLine.selectedPatient);  // Paciente selecionado
  console.log(waitingLine.isLoading);        // Booleano
  console.log(waitingLine.error);            // Mensagem de erro
  
  // Métodos
  await waitingLine.handleCallPatient(id);
  await waitingLine.handleStartAttendance(id);
  await waitingLine.handleFinishConsultation(id, observations);
  
  // Utilitários
  const count = waitingLine.getWaitingCount();
  const emergency = waitingLine.getPriorityCount('emergencia');
}
```

### `WaitingListPanel` - Componente de Lista

```javascript
import { WaitingListPanel } from '../pages-components/WaitingListPanel';

<WaitingListPanel
  waitingList={[...]}              // Array de entradas
  selectedPatient={patient}        // Paciente selecionado
  onCallPatient={async (id) => {}} // Callback
  onStartAttendance={async (id) => {}}
  onSelectPatient={async (id) => {}}
  isLoading={false}
/>
```

### `MedicalRecordPanel` - Componente de Prontuário

```javascript
import { MedicalRecordPanel } from '../pages-components/MedicalRecordPanel';

<MedicalRecordPanel
  patient={selectedPatient}                    // Dados do paciente
  onFinishConsultation={async (id, obs) => {}} // Callback finalizar
  onClose={() => {}}                           // Callback fechar
  isLoading={false}
/>
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie arquivo `.env` na pasta `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_POLLING_INTERVAL=15000
```

### Modificar Intervalo de Polling

Na página `DoctorDashboard.jsx`:

```javascript
const waitingLine = useWaitingLine({
  pollInterval: 10000,  // 10 segundos em vez de 15
  clinicArea: auth.clinicArea
});
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│                  DoctorDashboard                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  useAuth()          useWaitingLine()                    │
│      │                    │                              │
│      └─→ Autenticação     │                              │
│              │            │                              │
│              └──────┬──────┘                              │
│                     │                                    │
│              API Service                                 │
│           (waitingLineService)                           │
│                     │                                    │
│                     ↓                                    │
│         Backend API (Express)                            │
│           /api/waiting-line                              │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Estados da Fila

```
AGUARDANDO → CHAMADO → EM_ATENDIMENTO → FINALIZADO
                              ↓
                         (com evolução)
```

### Estados Possíveis

| Status | Descrição |
|--------|-----------|
| `aguardando` | Paciente na fila, não chamado |
| `chamado` | Paciente chamado, aguardando ir para consulta |
| `em_atendimento` | Médico atendendo paciente |
| `finalizado` | Consulta encerrada com observações |
| `cancelado` | Entrada cancelada |

---

## 🐛 Troubleshooting

### Problema: "Nenhum paciente na fila"

1. Verifique se a área da clínica está correta
2. Confirme que pacientes foram adicionados com essa área
3. Verifique o filtro no backend

### Problema: Polling não atualiza

1. Abra o Console (F12) e procure por erros
2. Verifique se o token JWT é válido
3. Confirme que a API backend está rodando

### Problema: Botões desabilitados

1. Certifique-se de que o paciente tem status correto
2. Evolução deve ter pelo menos 1 caractere para finalizar
3. Verifique se não há requisição pendente (spinner aparecendo)

---

## 🎯 Próximos Passos

- [ ] Implementar filtros avançados (data, prioridade)
- [ ] Adicionar histórico de atendimentos
- [ ] Integrar assinatura digital
- [ ] Notificações em tempo real (WebSocket)
- [ ] Exportar relatórios
- [ ] Modo offline

---

## 📝 Notas Técnicas

- **JWT Decode**: Implementado sem bibliotecas externas em `jwtUtils.js`
- **Polling**: Usa `setInterval` simples (considerar Server-Sent Events para alta escala)
- **Estilos**: Bootstrap 5 + CSS customizado
- **Estado**: React Hooks (useState, useEffect, useCallback, useRef)
- **HTTP**: Axios com interceptor automático

---

## 👨‍💻 Desenvolvimento

### Adicionar Novo Filtro

1. Adicione no schema `useWaitingLine()`:
```javascript
const waitingLine = useWaitingLine({
  novoFiltro: 'valor'
});
```

2. Atualize `waitingLineService.js`:
```javascript
if (filters.novoFiltro) queryParams.append('novoFiltro', filters.novoFiltro);
```

3. Use em componentes

---

## 📄 Licença

Projeto SAAS Doctor - Todos os direitos reservados

