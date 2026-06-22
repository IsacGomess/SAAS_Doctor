
# 🏗️ Arquitetura do Sistema - Fila de Espera

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND REACT 19                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                  App.jsx (Router)                                    │  │
│  │   /login  /register  /dashboard  /doctor/waiting-line [NEW]         │  │
│  └────────────────────────────┬─────────────────────────────────────────┘  │
│                               │                                             │
│                   ┌───────────▼──────────────┐                             │
│                   │  DoctorDashboard.jsx     │                             │
│                   │  (Página Principal) [NEW]│                             │
│                   └───────┬──────────┬────────┘                            │
│                           │          │                                     │
│      ┌────────────────────▼──┐  ┌───▼──────────────────────┐              │
│      │ LEFT COLUMN            │  │ RIGHT COLUMN             │              │
│      │                        │  │                          │              │
│      │ WaitingListPanel [NEW] │  │ MedicalRecordPanel [NEW] │              │
│      │                        │  │                          │              │
│      │ • Lista de pacientes   │  │ • Dados do paciente      │              │
│      │ • Números da fila      │  │ • Campo evolução         │              │
│      │ • Botões chamar        │  │ • Modal confirmação      │              │
│      │ • Botões atender       │  │ • Botão finalizar        │              │
│      └────┬───────────────────┘  └──┬────────────────────────┘             │
│           │                         │                                      │
│      ┌────▼─────────────────────────▼────────────────┐                   │
│      │         Hooks (Custom Logic) [NEW]            │                   │
│      │                                                │                   │
│      │  ┌──────────────┐    ┌──────────────────┐    │                   │
│      │  │ useAuth()    │    │ useWaitingLine() │    │                   │
│      │  │              │    │                  │    │                   │
│      │  │ • userId     │    │ • waitingList    │    │                   │
│      │  │ • userName   │    │ • Polling 15s    │    │                   │
│      │  │ • clinicArea │    │ • Métodos CRUD  │    │                   │
│      │  │ • logout()   │    │ • Filtros       │    │                   │
│      │  └──────────────┘    └──────────────────┘    │                   │
│      └────┬──────────────────────┬───────────────────┘                   │
│           │                      │                                        │
│      ┌────▼──────────────────────▼────────────────┐                    │
│      │     Services (API Integration) [NEW]       │                    │
│      │                                             │                    │
│      │  waitingLineService.js                      │                    │
│      │  • createWaitingLineEntry()                 │                    │
│      │  • getWaitingLine()                         │                    │
│      │  • callPatient()                            │                    │
│      │  • startAttendance()                        │                    │
│      │  • updateWaitingLineStatus()                │                    │
│      │  • finishConsultation()                     │                    │
│      │  • cancelWaitingLine()                      │                    │
│      │                                             │                    │
│      │  Utilitários:                               │                    │
│      │  • jwtUtils.js - Decodificar JWT            │                    │
│      │  • api.js - Axios com interceptor JWT       │                    │
│      └────┬─────────────────────────────────────────┘                  │
│           │                                                              │
│           │ HTTP Requests                                               │
│           │ Authorization: Bearer {token}                               │
│           │                                                              │
└───────────┼──────────────────────────────────────────────────────────────┘
            │
            │
┌───────────▼──────────────────────────────────────────────────────────────┐
│                      BACKEND EXPRESS.JS                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Routes: /api/waiting-line                                          │ │
│  │  ├─ POST   /create           → createWaitingLineEntry()           │ │
│  │  ├─ GET    /list             → getWaitingLine()                   │ │
│  │  ├─ GET    /:id              → getWaitingLineById()               │ │
│  │  ├─ PATCH  /:id/call         → callPatient()                      │ │
│  │  ├─ PATCH  /:id/status       → updateWaitingLineStatus()          │ │
│  │  └─ PATCH  /:id/cancel       → cancelWaitingLine()                │ │
│  └────┬─────────────────────────────────────────────────────────────┘ │
│       │                                                                  │
│  ┌────▼────────────────────────────────────────────────────────────┐  │
│  │  Middleware                                                      │  │
│  │  ├─ authenticateToken() [auth.js]                               │  │
│  │  └─ generalLimiter() [rate-limit.js]                            │  │
│  └────┬─────────────────────────────────────────────────────────────┘  │
│       │                                                                  │
│  ┌────▼────────────────────────────────────────────────────────────┐  │
│  │  Controllers: waiting-line.js                                    │  │
│  │  ├─ createWaitingLineEntry()   → Validação Zod                   │  │
│  │  ├─ getWaitingLine()           → Filtros                         │  │
│  │  ├─ getWaitingLineById()       → Populate references             │  │
│  │  ├─ callPatient()              → Status + timestamp              │  │
│  │  ├─ updateWaitingLineStatus()  → Validação + timestamps          │  │
│  │  └─ cancelWaitingLine()        → Soft delete pattern             │  │
│  └────┬─────────────────────────────────────────────────────────────┘  │
│       │                                                                  │
│  ┌────▼────────────────────────────────────────────────────────────┐  │
│  │  Models: Mongoose Schemas                                        │  │
│  │                                                                  │  │
│  │  WaitingLine Schema:                                             │  │
│  │  ├─ patientId (ref: Patient)                                    │  │
│  │  ├─ assignedTo (ref: User)                                      │  │
│  │  ├─ lineNumber (auto-increment)                                 │  │
│  │  ├─ status (enum)                                               │  │
│  │  ├─ priority (enum)                                             │  │
│  │  ├─ flowStage (enum)                                            │  │
│  │  ├─ clinicArea (String)                                         │  │
│  │  ├─ timestamps (checkIn, called, attended, completed)           │  │
│  │  └─ observations (String)                                       │  │
│  └────┬─────────────────────────────────────────────────────────────┘  │
│       │                                                                  │
└───────▼──────────────────────────────────────────────────────────────────┘
        │
        │ MongoDB Queries
        │
┌───────▼──────────────────────────────────────────────────────────────────┐
│                        DATABASE MONGODB                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Database: SAAS_Doctor                                                    │
│  Collections:                                                             │
│  ├─ users              [médicos/profissionais]                           │
│  ├─ patients           [dados dos pacientes]                             │
│  ├─ waiting_lines [NEW] [fila de espera]                                 │
│  ├─ medical_records     [prontuários]                                    │
│  ├─ prescriptions       [prescrições]                                    │
│  └─ evolutions         [evolução clínica]                                │
│                                                                            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados - Exemplo Prático

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Usuário clica "Chamar Paciente"                                          │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ onClick handler             │
              │ waitingLine.                │
              │ handleCallPatient(id)       │
              └─────────────────┬───────────┘
                                │
                                ▼
              ┌─────────────────────────────┐
              │ Hook useWaitingLine()       │
              │ Chama callPatient(id)       │
              └─────────────────┬───────────┘
                                │
                                ▼
              ┌─────────────────────────────┐
              │ Service                     │
              │ waitingLineService.js       │
              │ api.patch(                  │
              │   '/api/waiting-line/{id}/' │
              │   '/call'                   │
              │ )                           │
              └─────────────────┬───────────┘
                                │
                                ▼
              ┌─────────────────────────────┐
              │ Interceptor (api.js)        │
              │ Adiciona header:            │
              │ Authorization: Bearer {jwt} │
              └─────────────────┬───────────┘
                                │
                HTTP Request ───┼─── HTTPS
                                │
                                ▼ Backend
              ┌─────────────────────────────┐
              │ Route Handler               │
              │ /api/waiting-line/{id}/call │
              └─────────────────┬───────────┘
                                │
                                ▼
              ┌─────────────────────────────┐
              │ Middleware                  │
              │ authenticateToken()         │
              │ ✓ Token válido              │
              └─────────────────┬───────────┘
                                │
                                ▼
              ┌─────────────────────────────┐
              │ Controller                  │
              │ callPatient()               │
              │ • Busca entrada            │
              │ • Atualiza status→'chamado'│
              │ • Registra calledAt        │
              │ • Retorna JSON             │
              └─────────────────┬───────────┘
                                │
                                ▼
              ┌─────────────────────────────┐
              │ MongoDB                     │
              │ db.waiting_lines            │
              │ .findByIdAndUpdate()        │
              │ ✓ Atualizado               │
              └─────────────────┬───────────┘
                                │
                                ▼ Response JSON
              ┌─────────────────────────────┐
              │ Frontend                    │
              │ Response chega              │
              │ Hook atualiza estado        │
              │ waitingList re-renderiza    │
              │ ✓ Paciente mostrado como    │
              │   'chamado'                 │
              └─────────────────────────────┘
```

---

## 🎯 Fluxo de Autenticação

```
┌─────────────────┐
│  Login Page     │
│ email/password  │
└────────┬────────┘
         │
         ▼
    ┌────────────┐
    │ Backend    │
    │ /login     │
    │ ✓ Válido   │
    └────┬───────┘
         │
         │ Retorna:
         │ { token: "eyJ..." }
         │
         ▼
    ┌────────────────────┐
    │ localStorage       │
    │ .setItem(          │
    │   'token',         │
    │   'eyJ...'         │
    │ )                  │
    └────────┬───────────┘
             │
             ▼
    ┌─────────────────────────┐
    │ useAuth() hook          │
    │ Decodifica token        │
    │ Extrai userId/userName  │
    └────┬────────────────────┘
         │
         │ Para cada requisição:
         │
         ▼
    ┌──────────────────────────┐
    │ api.interceptors.request │
    │ Adiciona header:         │
    │ 'Authorization: Bearer'  │
    │ + token                  │
    └────┬─────────────────────┘
         │
         ▼
    ┌──────────────────────┐
    │ Backend Middleware   │
    │ authenticateToken()  │
    │ ✓ Valida JWT        │
    │ ✓ Continua requisição│
    └──────────────────────┘
```

---

## 📊 Estados Possíveis - Máquina de Estado

```
┌──────────────┐
│  AGUARDANDO  │  (Paciente na fila, não chamado)
│ (Entry novo) │
└──────┬───────┘
       │ [Chamar Paciente]
       ▼
┌──────────────┐
│   CHAMADO    │  (Paciente chamado, aguardando consultório)
│              │
└──────┬───────┘
       │ [Iniciar Atendimento]
       ▼
┌──────────────────┐
│ EM_ATENDIMENTO   │  (Médico atendendo)
│                  │
└──────┬───────────┘
       │ [Finalizar Consulta]
       │ + observações
       ▼
┌──────────────┐
│  FINALIZADO  │  (Consulta concluída)
│ + evolução   │
└──────────────┘

       CANCELADO  (A qualquer momento)
       (com motivo)
```

---

## 🔐 Segurança em Camadas

```
┌────────────────────────────────────────────────────────────┐
│ FRONTEND                                                    │
│ ├─ localStorage.token (JWT)                                │
│ └─ PrivateRoute component protege páginas                  │
├────────────────────────────────────────────────────────────┤
│ NETWORK                                                     │
│ └─ HTTPS/TLS (em produção)                                 │
│    Authorization: Bearer {token}                           │
├────────────────────────────────────────────────────────────┤
│ BACKEND MIDDLEWARE                                          │
│ ├─ authenticateToken() valida JWT                          │
│ ├─ limiter() previne brute force                           │
│ └─ Retorna 401 se token inválido/expirado                  │
├────────────────────────────────────────────────────────────┤
│ CONTROLLER                                                  │
│ ├─ Validação Zod dos dados                                 │
│ └─ Sanitização de input                                    │
├────────────────────────────────────────────────────────────┤
│ DATABASE                                                    │
│ ├─ Índices em campos sensíveis                             │
│ ├─ Sem senhas armazenadas em texto claro                   │
│ └─ Soft deletes (cancelados, não deletados)                │
└────────────────────────────────────────────────────────────┘
```

---

## ⚡ Performance - Polling vs Alternativas

```
Polling (15s)
├─ ✅ Simples implementar
├─ ✅ Compatível com todos navegadores
├─ ✅ Stateless no servidor
├─ ⚠️  15 requisições/min por usuário
└─ ⚠️  Latência máxima: 15 segundos

WebSocket
├─ ✅ Real-time (latência mínima)
├─ ✅ Conexão persistente
├─ ✅ Bidirecional
├─ ⚠️  Complexo implementar
└─ ⚠️  Precisa gerenciar conexões

Server-Sent Events
├─ ✅ Real-time
├─ ✅ Mais simples que WebSocket
├─ ✅ Unidirecional (server → client)
├─ ⚠️  Navegadores modernos apenas
└─ ⚠️  Stateful no servidor

ATUAL: Polling é bom trade-off
FUTURA: Migrar para WebSocket se necessário
```

---

## 📈 Escalabilidade

```
Com Polling (15s):
├─ 1 médico   = 1 req/15s  ✓
├─ 10 médicos = 10 req/15s ✓
├─ 100 médicos = 100 req/15s (6.7 req/s) ✓
└─ 1000 médicos = 1000 req/15s (66.7 req/s) ⚠️

Otimizações disponíveis:
├─ Cache responses (Redis)
├─ Database indexes
├─ Connection pooling
├─ Load balancing
└─ WebSocket upgrade
```

---

## 🎨 Componentes Reutilizáveis

```
DoctorDashboard
├─ WaitingListPanel
│  ├─ Reutilizável em outras páginas
│  ├─ Props: waitingList, selectedPatient, onCallPatient...
│  └─ CSS modular (WaitingListPanel.css)
│
├─ MedicalRecordPanel
│  ├─ Reutilizável para prontuários
│  ├─ Props: patient, onFinishConsultation, onClose...
│  └─ CSS modular (MedicalRecordPanel.css)
│
├─ useAuth()
│  ├─ Reutilizável em qualquer componente
│  ├─ Gerencia autenticação global
│  └─ Independente de UI
│
└─ useWaitingLine()
   ├─ Reutilizável em qualquer componente
   ├─ Gerencia fila globalmente
   └─ Independente de UI
```

---


