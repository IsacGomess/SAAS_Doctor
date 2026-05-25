# 📋 PLANO DE REFATORAÇÃO - Monólito Modular

## 🎯 Objetivo
Reorganizar o backend de uma estrutura **vertical por camadas técnicas** para uma estrutura **horizontal por módulos de negócio**, mantendo toda a lógica de negócios e funcionamento intacto.

---

## 📊 MAPEAMENTO DE MÓDULOS DE NEGÓCIO

### 1️⃣ **MÓDULO: users**
Responsável por autenticação, registro e gestão de usuários/membros da clínica.

| Arquivo Atual | Novo Arquivo | Localização |
|---|---|---|
| `controllers/user.js` | `src/modules/users/user.controller.js` | ✅ Mover completo |
| `models/user.js` | `src/modules/users/user.model.js` | ✅ Mover completo |
| `routes/user.js` | `src/modules/users/user.routes.js` | ✅ Mover (pacientes saem daqui) |

**Funções que permanecem:**
- `register()` - Registrar novo médico
- `login()` - Login de usuário
- `addMembro()` - Adicionar membro à clínica
- `getMembros()` - Listar membros da clínica
- `deleteMembro()` - Remover membro da clínica

---

### 2️⃣ **MÓDULO: patients**
Responsável por pacientes, registros médicos, evoluções e prescrições.

| Arquivo Atual | Novo Arquivo | Localização |
|---|---|---|
| `controllers/patient.js` | `src/modules/patients/patient.controller.js` | ✅ Mover completo |
| `models/patient.js` | `src/modules/patients/patient.model.js` | ✅ Mover completo |
| `models/medicalRecord.js` | `src/modules/patients/medicalRecord.model.js` | ✅ Mover completo |
| `models/evolution.js` | `src/modules/patients/evolution.model.js` | ✅ Mover completo |
| `models/prescription.js` | `src/modules/patients/prescription.model.js` | ✅ Mover completo |
| **(Extraído de routes/user.js)** | `src/modules/patients/patient.routes.js` | ✅ Novo arquivo |

**Funções que permanecem:**
- `registerPatient()` - Criar paciente
- `getPatients()` - Listar pacientes
- `medicalRecord()` - Criar registro médico
- `getMedicalRecords()` - Obter registros médicos
- `evolution()` - Criar evolução
- `getEvolutions()` - Obter evoluções
- `prescription()` - Criar prescrição
- `getPrescriptions()` - Obter prescrições
- `canAccessPatient()` - Helper de validação de acesso

---

### 3️⃣ **MÓDULO: clinics**
Responsável por gestão de clínicas.

| Arquivo Atual | Novo Arquivo | Localização |
|---|---|---|
| `controllers/clinica.js` | `src/modules/clinics/clinic.controller.js` | ✅ Mover com renomeação |
| `models/clinica.js` | `src/modules/clinics/clinic.model.js` | ✅ Mover com renomeação |
| `routes/clinicas.js` | `src/modules/clinics/clinic.routes.js` | ✅ Mover com renomeação |

**Funções que permanecem:**
- `createClinica()` - Criar clínica
- `getMyClinica()` - Obter dados da clínica do usuário

---

### 4️⃣ **MÓDULO: waiting-line**
Responsável por gestão da fila de espera de pacientes.

| Arquivo Atual | Novo Arquivo | Localização |
|---|---|---|
| `controllers/waiting-line.js` | `src/modules/waiting-line/waiting-line.controller.js` | ✅ Mover completo |
| `models/flow-clinic/waiting-line.js` | `src/modules/waiting-line/waiting-line.model.js` | ✅ Mover (simplificar path) |
| `routes/waiting-line.js` | `src/modules/waiting-line/waiting-line.routes.js` | ✅ Mover completo |

**Funções que permanecem:**
- `createWaitingLineEntry()` - Criar entrada na fila
- `getWaitingLine()` - Listar fila com filtros
- `getWaitingLineById()` - Obter entrada específica
- `callPatient()` - Chamar paciente
- `updateWaitingLineStatus()` - Atualizar status
- `cancelWaitingLine()` - Cancelar entrada

---

### 🔐 **MIDDLEWARES GLOBAIS**
Devem ir para `src/middlewares/` (sem mudanças na lógica):

| Arquivo Atual | Novo Arquivo |
|---|---|
| `middlewares/auth.js` | `src/middlewares/auth.js` |
| `middlewares/rate-limit.js` | `src/middlewares/rate-limit.js` |

---

## 📁 ESTRUTURA DE DIRETÓRIOS - ANTES E DEPOIS

### ❌ ANTES (Atual)
```
backend/
├── controllers/
│   ├── user.js
│   ├── patient.js
│   ├── clinica.js
│   └── waiting-line.js
├── models/
│   ├── index.js
│   ├── user.js
│   ├── patient.js
│   ├── medicalRecord.js
│   ├── evolution.js
│   ├── prescription.js
│   ├── clinica.js
│   └── flow-clinic/
│       └── waiting-line.js
├── routes/
│   ├── user.js
│   ├── clinicas.js
│   └── waiting-line.js
├── middlewares/
│   ├── auth.js
│   └── rate-limit.js
├── package.json
└── server.js
```

### ✅ DEPOIS (Nova Estrutura)
```
backend/
├── src/
│   ├── middlewares/
│   │   ├── auth.js
│   │   └── rate-limit.js
│   ├── modules/
│   │   ├── users/
│   │   │   ├── user.controller.js
│   │   │   ├── user.model.js
│   │   │   └── user.routes.js
│   │   ├── patients/
│   │   │   ├── patient.controller.js
│   │   │   ├── patient.model.js
│   │   │   ├── medicalRecord.model.js
│   │   │   ├── evolution.model.js
│   │   │   ├── prescription.model.js
│   │   │   └── patient.routes.js
│   │   ├── clinics/
│   │   │   ├── clinic.controller.js
│   │   │   ├── clinic.model.js
│   │   │   └── clinic.routes.js
│   │   └── waiting-line/
│   │       ├── waiting-line.controller.js
│   │       ├── waiting-line.model.js
│   │       └── waiting-line.routes.js
│   └── server.js
├── package.json
└── (Arquivos antigos deletados: controllers/, models/, routes/, middlewares/)
```

---

## 🛠️ PASSO A PASSO DE MOVIMENTAÇÃO

### **FASE 1: Criar Estrutura de Diretórios**

Execute os comandos (a partir de `backend/`):
```bash
# Criar diretório src
mkdir -p src/middlewares
mkdir -p src/modules/users
mkdir -p src/modules/patients
mkdir -p src/modules/clinics
mkdir -p src/modules/waiting-line
```

---

### **FASE 2: Mover Middlewares Globais**

**Ação:** Copiar com atualização mínima (sem mudanças de imports internos)

```bash
# Mover middlewares
cp middlewares/auth.js src/middlewares/auth.js
cp middlewares/rate-limit.js src/middlewares/rate-limit.js
```

**Arquivos:** `src/middlewares/auth.js` e `src/middlewares/rate-limit.js`
- ✅ Não precisam de mudanças internas (não têm imports relativos)

---

### **FASE 3: Mover Módulo USERS**

#### 3.1 - Copiar e Atualizar `src/modules/users/user.model.js`
**De:** `models/user.js`  
**Para:** `src/modules/users/user.model.js`
- ✅ Nenhuma mudança (não tem imports)

#### 3.2 - Copiar e Atualizar `src/modules/users/user.controller.js`
**De:** `controllers/user.js`  
**Para:** `src/modules/users/user.controller.js`

**MUDANÇA DE IMPORTS:**
```javascript
// ❌ ANTES (imports relativos à pasta controllers/)
const { User } = require('../models');

// ✅ DEPOIS (imports relativos à pasta modules/users/)
const { User } = require('./user.model.js');
```

#### 3.3 - Copiar e Atualizar `src/modules/users/user.routes.js`
**De:** `routes/user.js`  
**Para:** `src/modules/users/user.routes.js`

**MUDANÇAS DE IMPORTS:**
```javascript
// ❌ ANTES
const userController = require('../controllers/user');
const patientController = require('../controllers/patient');
const authMiddleware = require('../middlewares/auth');
const limiter = require('../middlewares/rate-limit');

// ✅ DEPOIS
const userController = require('./user.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');

// REMOVIDO: patientController (vai para patients.routes.js)
// REMOVIDAS: Rotas de patients (vão para patients.routes.js)
```

**ROTAS A REMOVER DESTE ARQUIVO:**
```javascript
// ❌ REMOVER TODAS AS ROTAS DE PATIENTS
routes.get('/patients/atendance-list', patientController.getPatients);
routes.post('/patients/register-patient', patientController.registerPatient);
routes.post('/patients/create-medical-record', patientController.medicalRecord);
routes.get('/patients/:patientId/get-medical-records', patientController.getMedicalRecords);
routes.post('/patients/create-evolution', patientController.evolution);
routes.get('/patients/:patientId/get-evolutions', patientController.getEvolutions);
routes.post('/patients/create-prescription', patientController.prescription);
routes.get('/patients/:patientId/get-prescriptions', patientController.getPrescriptions);
```

**ROTAS A MANTER:**
```javascript
// ✅ Apenas rotas de usuários
routes.post('/register', limiter.authLimiter, userController.register);
routes.post('/login', limiter.authLimiter, userController.login);
routes.use(authMiddleware.authenticateToken);
routes.use(limiter.generalLimiter);
routes.post('/membros', userController.addMembro);
routes.get('/membros', userController.getMembros);
routes.delete('/membros/:membroId', userController.deleteMembro);
```

---

### **FASE 4: Mover Módulo PATIENTS**

#### 4.1 - Copiar Models
```bash
cp models/patient.js src/modules/patients/patient.model.js
cp models/medicalRecord.js src/modules/patients/medicalRecord.model.js
cp models/evolution.js src/modules/patients/evolution.model.js
cp models/prescription.js src/modules/patients/prescription.model.js
```
- ✅ Nenhuma mudança necessária (não têm imports)

#### 4.2 - Copiar e Atualizar `src/modules/patients/patient.controller.js`
**De:** `controllers/patient.js`  
**Para:** `src/modules/patients/patient.controller.js`

**MUDANÇA DE IMPORTS:**
```javascript
// ❌ ANTES
const { Patient, MedicalRecord, Evolution, Prescription } = require('../models');

// ✅ DEPOIS
const Patient = require('./patient.model.js');
const MedicalRecord = require('./medicalRecord.model.js');
const Evolution = require('./evolution.model.js');
const Prescription = require('./prescription.model.js');
```

#### 4.3 - Criar NOVO `src/modules/patients/patient.routes.js`
**Extrai rotas de:** `routes/user.js`  
**Novo arquivo:** `src/modules/patients/patient.routes.js`

```javascript
const express = require('express');
const routes = express.Router();
const patientController = require('./patient.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');

// Middleware de autenticação para todas as rotas
routes.use(authMiddleware.authenticateToken);
routes.use(limiter.generalLimiter);

// Rotas de pacientes (extraídas de user.routes.js)
routes.get('/atendance-list', patientController.getPatients);
routes.post('/register-patient', patientController.registerPatient);
routes.post('/create-medical-record', patientController.medicalRecord);
routes.get('/:patientId/get-medical-records', patientController.getMedicalRecords);
routes.post('/create-evolution', patientController.evolution);
routes.get('/:patientId/get-evolutions', patientController.getEvolutions);
routes.post('/create-prescription', patientController.prescription);
routes.get('/:patientId/get-prescriptions', patientController.getPrescriptions);

module.exports = routes;
```

---

### **FASE 5: Mover Módulo CLINICS**

#### 5.1 - Copiar e Renomear Model
```bash
cp models/clinica.js src/modules/clinics/clinic.model.js
```
**Conteúdo:** Nenhuma mudança necessária

#### 5.2 - Copiar e Atualizar Controller
**De:** `controllers/clinica.js`  
**Para:** `src/modules/clinics/clinic.controller.js`

**MUDANÇA DE IMPORTS:**
```javascript
// ❌ ANTES
const { Clinica, User } = require('../models');

// ✅ DEPOIS
const Clinica = require('./clinic.model.js');
const User = require('../users/user.model.js');
```

#### 5.3 - Copiar e Renomear Routes
**De:** `routes/clinicas.js`  
**Para:** `src/modules/clinics/clinic.routes.js`

**MUDANÇA DE IMPORTS:**
```javascript
// ❌ ANTES
const clinicaController = require('../controllers/clinica');
const authMiddleware = require('../middlewares/auth');
const limiter = require('../middlewares/rate-limit');

// ✅ DEPOIS
const clinicController = require('./clinic.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');

// ✅ RENOMEAR REFERÊNCIA
routes.post('/', clinicController.createClinica);
routes.get('/me', clinicController.getMyClinica);
```

---

### **FASE 6: Mover Módulo WAITING-LINE**

#### 6.1 - Copiar e Mover Model
```bash
cp models/flow-clinic/waiting-line.js src/modules/waiting-line/waiting-line.model.js
```
**Conteúdo:** Nenhuma mudança necessária

#### 6.2 - Copiar e Atualizar Controller
**De:** `controllers/waiting-line.js`  
**Para:** `src/modules/waiting-line/waiting-line.controller.js`

**MUDANÇA DE IMPORTS:**
```javascript
// ❌ ANTES
const { WaitingLine, Patient } = require('../models');

// ✅ DEPOIS
const WaitingLine = require('./waiting-line.model.js');
const Patient = require('../patients/patient.model.js');
```

#### 6.3 - Copiar e Atualizar Routes
**De:** `routes/waiting-line.js`  
**Para:** `src/modules/waiting-line/waiting-line.routes.js`

**MUDANÇA DE IMPORTS:**
```javascript
// ❌ ANTES
const waitingLineController = require('../controllers/waiting-line');
const authMiddleware = require('../middlewares/auth');
const limiter = require('../middlewares/rate-limit');

// ✅ DEPOIS
const waitingLineController = require('./waiting-line.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');
```

---

### **FASE 7: Atualizar `src/server.js`**

**De:** `server.js` (raiz)  
**Para:** `src/server.js`

**MUDANÇAS NECESSÁRIAS:**

```javascript
// ❌ ANTES
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const waitingLineRoutes = require('./routes/waiting-line');
const clinicaRoutes = require('./routes/clinicas');
const routeUser = require('./routes/user');

// ... resto do código ...

// ✅ DEPOIS
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// ✅ IMPORTAR ROTAS DOS MÓDULOS
const userRoutes = require('./modules/users/user.routes.js');
const patientRoutes = require('./modules/patients/patient.routes.js');
const clinicRoutes = require('./modules/clinics/clinic.routes.js');
const waitingLineRoutes = require('./modules/waiting-line/waiting-line.routes.js');

const app = express();

// ... (rest of middleware setup - no changes) ...

// ✅ USAR AS ROTAS COM OS NOVOS PATHS
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/waiting-line', waitingLineRoutes);

app.get('/api/doctor', (req, res) => {
    res.send('API de médicos!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
```

---

### **FASE 8: Atualizar `package.json`**

**Mudança de start script:**

```json
{
  "scripts": {
    "start": "node --watch src/server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

---

## 🔄 MAPEAMENTO FINAL DE IMPORTS

### User Model
```javascript
// Não tem imports - nenhuma mudança
```

### User Controller
```javascript
// Antes
const { User } = require('../models');

// Depois
const User = require('./user.model.js');
```

### Patient Models
```javascript
// Antes: Nenhum import
// Depois: Nenhum import (models não têm dependências entre si)
```

### Patient Controller
```javascript
// Antes
const { Patient, MedicalRecord, Evolution, Prescription } = require('../models');

// Depois
const Patient = require('./patient.model.js');
const MedicalRecord = require('./medicalRecord.model.js');
const Evolution = require('./evolution.model.js');
const Prescription = require('./prescription.model.js');
```

### Clinic Controller
```javascript
// Antes
const { Clinica, User } = require('../models');

// Depois
const Clinica = require('./clinic.model.js');
const User = require('../users/user.model.js');
```

### Waiting Line Controller
```javascript
// Antes
const { WaitingLine, Patient } = require('../models');

// Depois
const WaitingLine = require('./waiting-line.model.js');
const Patient = require('../patients/patient.model.js');
```

### All Routes Files
```javascript
// Antes
const authMiddleware = require('../middlewares/auth');
const limiter = require('../middlewares/rate-limit');

// Depois (varia conforme a pasta)
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');
```

---

## ✅ VALIDAÇÃO PÓS-REFATORAÇÃO

Após executar todas as fases, verifique:

1. **Deletar arquivos antigos** (após garantir que tudo foi movido):
   ```bash
   rm -rf controllers/
   rm -rf models/
   rm -rf routes/
   rm -rf middlewares/
   rm server.js
   ```

2. **Testar inicialização do servidor:**
   ```bash
   npm start
   # Deve conectar ao MongoDB e exibir: "Server is running on port 3000"
   ```

3. **Testar cada rota:**
   - POST `/api/users/register` - Registro de médico
   - POST `/api/users/login` - Login
   - POST `/api/users/membros` - Adicionar membro
   - GET `/api/users/membros` - Listar membros
   - DELETE `/api/users/membros/:id` - Remover membro
   - POST `/api/patients/register-patient` - Criar paciente
   - GET `/api/patients/atendance-list` - Listar pacientes
   - POST `/api/clinics/` - Criar clínica
   - GET `/api/clinics/me` - Obter clínica
   - POST `/api/waiting-line/create` - Criar fila
   - GET `/api/waiting-line/list` - Listar fila

---

## 📝 NOTAS IMPORTANTES

✅ **MANTIDO:**
- Toda a lógica de negócio
- Todas as validações com Zod
- Todas as autenticações JWT
- Todas as verificações de acesso
- Todos os logs de debug
- Todos os middlewares de rate limiting

❌ **REMOVIDO:**
- Apenas os arquivos antigos e paths antigos
- Arquivo `models/index.js` (não é mais necessário com imports diretos)

🔄 **MUDANÇAS ESTRUTURAIS:**
- Paths de imports (relativos de cada módulo)
- Arquivo de entrada: `server.js` → `src/server.js`
- Script de start: aponta para `src/server.js`

---

## 🚀 PRÓXIMOS PASSOS

Após completar a refatoração:

1. Testar completamente o backend
2. Confirmar que o frontend continua funcionando
3. Fazer commit: `git commit -m "refactor: reorganizar backend para arquitetura modular horizontal"`
4. Considerar adicionar:
   - `src/utils/` para código compartilhado entre módulos
   - `src/config/` para configurações centralizadas
   - `src/constants/` para constantes globais
   - `src/validators/` para schemas Zod compartilhados (opcional)
