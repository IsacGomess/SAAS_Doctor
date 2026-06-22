# 🏗️ DIAGRAMA DE ARQUITETURA - Antes e Depois



## DEPOIS: Estrutura Horizontal por Módulos (Nova)

```
backend/
│
├── src/
│   │
│   ├── middlewares/             ← Middlewares GLOBAIS
│   │   ├── auth.js
│   │   └── rate-limit.js
│   │
│   ├── modules/                 ← Domínios de Negócio (Modular)
│   │   │
│   │   ├── users/               ← 🟦 MÓDULO: Autenticação & Gestão de Usuários
│   │   │   ├── user.model.js
│   │   │   ├── user.controller.js
│   │   │   └── user.routes.js
│   │   │
│   │   ├── patients/            ← 🟩 MÓDULO: Pacientes & Dados Médicos
│   │   │   ├── patient.model.js
│   │   │   ├── medicalRecord.model.js
│   │   │   ├── evolution.model.js
│   │   │   ├── prescription.model.js
│   │   │   ├── patient.controller.js
│   │   │   └── patient.routes.js
│   │   │
│   │   ├── clinics/             ← 🟧 MÓDULO: Gestão de Clínicas
│   │   │   ├── clinic.model.js
│   │   │   ├── clinic.controller.js
│   │   │   └── clinic.routes.js
│   │   │
│   │   └── waiting-line/        ← 🟨 MÓDULO: Fila de Espera
│   │       ├── waiting-line.model.js
│   │       ├── waiting-line.controller.js
│   │       └── waiting-line.routes.js
│   │
│   └── server.js                ← Arquivo de entrada
│
├── package.json
└── (arquivos antigos deletados)
```

### ✅ Vantagens desta Arquitetura

- **Coesão máxima:** Tudo de um domínio está junto
- **Fácil navegação:** Entre em uma pasta e encontra tudo relacionado
- **Escalável:** Novos módulos seguem padrão claro
- **Auto-explicativo:** Estrutura deixa responsabilidades claras
- **Testável:** Cada módulo pode ser testado isoladamente

---

## 🔗 MAPA DE DEPENDÊNCIAS

### Estrutura de Imports - NOVO

```
┌─────────────────────────────────────────────────────┐
│                   src/server.js                     │
│              (Arquivo de Entrada)                   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ├──→ ./modules/users/user.routes.js
                       ├──→ ./modules/patients/patient.routes.js
                       ├──→ ./modules/clinics/clinic.routes.js
                       └──→ ./modules/waiting-line/waiting-line.routes.js


┌────────────────────────────────────────────────────────┐
│    users/user.routes.js                                │
│    (Mount: /api/users)                                 │
├────────────────────────────────────────────────────────┤
│ Imports:                                               │
│  • ./user.controller.js                                │
│  • ../../middlewares/auth.js (global)                  │
│  • ../../middlewares/rate-limit.js (global)            │
└────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────┐
│    users/user.controller.js                            │
│    (Controllers de usuários)                           │
├────────────────────────────────────────────────────────┤
│ Imports:                                               │
│  • ./user.model.js                                     │
│  • jsonwebtoken (npm)                                  │
│  • bcrypt (npm)                                        │
│  • zod (npm)                                           │
└────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────┐
│    patients/patient.routes.js                          │
│    (Mount: /api/patients)                              │
├────────────────────────────────────────────────────────┤
│ Imports:                                               │
│  • ./patient.controller.js                             │
│  • ../../middlewares/auth.js (global)                  │
│  • ../../middlewares/rate-limit.js (global)            │
└────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────┐
│    patients/patient.controller.js                      │
│    (Controllers de pacientes e dados médicos)          │
├────────────────────────────────────────────────────────┤
│ Imports:                                               │
│  • ./patient.model.js                                  │
│  • ./medicalRecord.model.js                            │
│  • ./evolution.model.js                                │
│  • ./prescription.model.js                             │
│  • zod (npm)                                           │
└────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────┐
│    clinics/clinic.routes.js                            │
│    (Mount: /api/clinics)                               │
├────────────────────────────────────────────────────────┤
│ Imports:                                               │
│  • ./clinic.controller.js                              │
│  • ../../middlewares/auth.js (global)                  │
│  • ../../middlewares/rate-limit.js (global)            │
└────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────┐
│    clinics/clinic.controller.js                        │
│    (Controllers de clínicas)                           │
├────────────────────────────────────────────────────────┤
│ Imports:                                               │
│  • ./clinic.model.js                                   │
│  • ../users/user.model.js ⭐ (referência cruzada OK)   │
│  • jsonwebtoken (npm)                                  │
│  • zod (npm)                                           │
└────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────┐
│    waiting-line/waiting-line.routes.js                 │
│    (Mount: /api/waiting-line)                          │
├────────────────────────────────────────────────────────┤
│ Imports:                                               │
│  • ./waiting-line.controller.js                        │
│  • ../../middlewares/auth.js (global)                  │
│  • ../../middlewares/rate-limit.js (global)            │
└────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────┐
│    waiting-line/waiting-line.controller.js             │
│    (Controllers de fila)                               │
├────────────────────────────────────────────────────────┤
│ Imports:                                               │
│  • ./waiting-line.model.js                             │
│  • ../patients/patient.model.js ⭐ (referência cruzada)│
│  • zod (npm)                                           │
└────────────────────────────────────────────────────────┘
```

---

## 📊 FLUXO DE REQUISIÇÃO - Exemplo

### Exemplo 1: Registrar Novo Paciente

```
Requisição: POST /api/patients/register-patient
    ↓
src/server.js (busca rota)
    ↓
app.use('/api/patients', patientRoutes)
    ↓
patients/patient.routes.js (match rota)
    ↓
routes.post('/register-patient', authMiddleware, patientController.registerPatient)
    ↓
../../middlewares/auth.js (verifica JWT)
    ↓
patient.controller.js - registerPatient()
    ↓
./patient.model.js - Patient.create()
    ↓
MongoDB (salva documento)
    ↓
Response: 201 { success: true, patient: {...} }
```

### Exemplo 2: Login de Médico

```
Requisição: POST /api/users/login
    ↓
src/server.js (busca rota)
    ↓
app.use('/api/users', userRoutes)
    ↓
users/user.routes.js (match rota)
    ↓
routes.post('/login', authLimiter, userController.login)
    ↓
user.controller.js - login()
    ↓
./user.model.js - User.findOne()
    ↓
bcrypt.compare() + jwt.sign()
    ↓
Response: 200 { accessToken, refreshToken, user }
```

### Exemplo 3: Adicionar Membro à Clínica

```
Requisição: POST /api/users/membros (com token)
    ↓
users/user.routes.js
    ↓
authMiddleware + generalLimiter
    ↓
userController.addMembro()
    ↓
./user.model.js:
  - User.findById(req.userId) ✅
  - User.create({...}) ✅
    ↓
Response: 201 { membro }
```

### Exemplo 4: Criar Entrada na Fila

```
Requisição: POST /api/waiting-line/create (com token)
    ↓
waiting-line/waiting-line.routes.js
    ↓
authMiddleware + generalLimiter
    ↓
waitingLineController.createWaitingLineEntry()
    ↓
validação com Zod schema
    ↓
./waiting-line.model.js - WaitingLine.create()
    ↓
(referência cruzada) ../patients/patient.model.js - Patient.findById()
    ↓
MongoDB (salva e valida)
    ↓
Response: 201 { entry }
```

---

## 🔄 CROSS-MODULE DEPENDENCIES (Referências Entre Módulos)

### Permitidas (Já mapeadas):

```
clinics/clinic.controller.js
    ↓ (acessa)
../users/user.model.js ✅ PERMITIDO
(Clínicas precisam criar usuários)


waiting-line/waiting-line.controller.js
    ↓ (acessa)
../patients/patient.model.js ✅ PERMITIDO
(Fila precisa validar pacientes)
```

### ❌ NÃO Permitidas (Para evitar):

```
users/user.controller.js → patients/patient.model.js ❌ NÃO
(Usuários não devem conhecer patients)

patients/patient.controller.js → clinics/clinic.model.js ❌ NÃO
(Pacientes não devem conhecer clínicas diretamente)
```

**Observação:** No código atual, existem algumas referências necessárias (acima marcadas com ✅) que são OK porque representam relacionamentos de negócio legítimos.

---

## 📈 COMO ESCALAR

Para adicionar um novo módulo (ex: `appointments`):

```bash
mkdir -p src/modules/appointments
```

E criar:
```
src/modules/appointments/
├── appointment.model.js       ← Schema MongoDB
├── appointment.controller.js  ← Lógica
└── appointment.routes.js      ← Endpoints
```

Então importar em `src/server.js`:
```javascript
const appointmentRoutes = require('./modules/appointments/appointment.routes.js');
app.use('/api/appointments', appointmentRoutes);
```

**Pronto!** Novo módulo integrado 🚀

---

## 🎯 RESUMO EXECUTIVO

| Aspecto | Antes | Depois |
|---|---|---|
| **Organização** | Vertical por camadas | Horizontal por domínio |
| **Clareza** | Confusa (pacientes em users) | Clara (cada módulo tem tudo) |
| **Escalabilidade** | Difícil (mistura-se com tempo) | Fácil (padrão claro) |
| **Testabilidade** | Acoplado | Desacoplado por módulo |
| **Manutenção** | Busca em múltiplas pastas | Tudo em uma pasta |
| **Onboarding** | Curva longa | Rápido entendimento |

---

