# 🔗 GUIA RÁPIDO - Imports & Paths da Nova Arquitetura

Use este documento como referência enquanto refatora. Copie os imports corretos diretamente daqui.

---

## 📍 LOCALIZAÇÃO FINAL DOS ARQUIVOS

```
src/
├── middlewares/
│   ├── auth.js                                  # 🔓 Middleware de autenticação
│   └── rate-limit.js                            # ⚡ Rate limiting
├── modules/
│   ├── users/
│   │   ├── user.model.js                        # 👤 Schema: User
│   │   ├── user.controller.js                   # 👤 Lógica: register, login, addMembro...
│   │   └── user.routes.js                       # 👤 Rotas: /register, /login, /membros
│   ├── patients/
│   │   ├── patient.model.js                     # 🏥 Schema: Patient
│   │   ├── medicalRecord.model.js               # 🏥 Schema: MedicalRecord
│   │   ├── evolution.model.js                   # 🏥 Schema: Evolution
│   │   ├── prescription.model.js                # 🏥 Schema: Prescription
│   │   ├── patient.controller.js                # 🏥 Lógica: registerPatient, getPatients...
│   │   └── patient.routes.js                    # 🏥 Rotas: /register-patient, /atendance-list...
│   ├── clinics/
│   │   ├── clinic.model.js                      # 🏢 Schema: Clinic
│   │   ├── clinic.controller.js                 # 🏢 Lógica: createClinica, getMyClinica
│   │   └── clinic.routes.js                     # 🏢 Rotas: /, /me
│   └── waiting-line/
│       ├── waiting-line.model.js                # ⏳ Schema: WaitingLine
│       ├── waiting-line.controller.js           # ⏳ Lógica: createWaitingLineEntry...
│       └── waiting-line.routes.js               # ⏳ Rotas: /create, /list, /:id...
└── server.js                                    # 🚀 Arquivo de entrada
```

---

## 🎯 IMPORTS CORRETOS POR ARQUIVO

### src/server.js
```javascript
// ✅ IMPORTS DE ROTAS
const userRoutes = require('./modules/users/user.routes.js');
const patientRoutes = require('./modules/patients/patient.routes.js');
const clinicRoutes = require('./modules/clinics/clinic.routes.js');
const waitingLineRoutes = require('./modules/waiting-line/waiting-line.routes.js');

// ✅ USAR AS ROTAS
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/waiting-line', waitingLineRoutes);
```

---

### src/modules/users/user.routes.js
```javascript
const express = require('express');
const routes = express.Router();

// ✅ Controller do mesmo módulo
const userController = require('./user.controller.js');

// ✅ Middlewares globais (suba 2 níveis)
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');

// ✅ Rotas públicas
routes.post('/register', limiter.authLimiter, userController.register);
routes.post('/login', limiter.authLimiter, userController.login);

// ✅ Middlewares para rotas protegidas
routes.use(authMiddleware.authenticateToken);
routes.use(limiter.generalLimiter);

// ✅ Rotas protegidas
routes.post('/membros', userController.addMembro);
routes.get('/membros', userController.getMembros);
routes.delete('/membros/:membroId', userController.deleteMembro);

module.exports = routes;
```

---

### src/modules/users/user.controller.js
```javascript
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const bcrypt = require('bcrypt');

// ✅ Model do mesmo módulo
const User = require('./user.model.js');

// ✅ Exports de functions (register, login, addMembro, getMembros, deleteMembro)
exports.register = async (req, res) => { ... };
exports.login = async (req, res) => { ... };
exports.addMembro = async (req, res) => { ... };
exports.getMembros = async (req, res) => { ... };
exports.deleteMembro = async (req, res) => { ... };
```

---

### src/modules/users/user.model.js
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// ✅ Nenhum import de arquivos locais
// Apenas schemas mongoose

const userSchema = new mongoose.Schema({ ... });
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('User', userSchema);
```

---

### src/modules/patients/patient.routes.js
```javascript
const express = require('express');
const routes = express.Router();

// ✅ Controller do mesmo módulo
const patientController = require('./patient.controller.js');

// ✅ Middlewares globais (suba 2 níveis)
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');

// ✅ Middlewares para todas as rotas
routes.use(authMiddleware.authenticateToken);
routes.use(limiter.generalLimiter);

// ✅ Rotas de pacientes
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

### src/modules/patients/patient.controller.js
```javascript
const { z } = require('zod');

// ✅ Models do mesmo módulo
const Patient = require('./patient.model.js');
const MedicalRecord = require('./medicalRecord.model.js');
const Evolution = require('./evolution.model.js');
const Prescription = require('./prescription.model.js');

// ✅ Exports de functions
exports.registerPatient = async (req, res) => { ... };
exports.getPatients = async (req, res) => { ... };
exports.medicalRecord = async (req, res) => { ... };
exports.getMedicalRecords = async (req, res) => { ... };
exports.evolution = async (req, res) => { ... };
exports.getEvolutions = async (req, res) => { ... };
exports.prescription = async (req, res) => { ... };
exports.getPrescriptions = async (req, res) => { ... };
exports.canAccessPatient = (req, patient) => { ... };
```

---

### src/modules/patients/[modelo].model.js
```javascript
const mongoose = require('mongoose');

// ✅ Nenhum import de arquivos locais
// Cada arquivo tem apenas seu schema

// patient.model.js
const patientSchema = new mongoose.Schema({ ... });
module.exports = mongoose.model('Patient', patientSchema);

// medicalRecord.model.js
const medicalRecordSchema = new mongoose.Schema({ ... });
module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);

// evolution.model.js
const evolutionSchema = new mongoose.Schema({ ... });
module.exports = mongoose.model('Evolution', evolutionSchema);

// prescription.model.js
const prescriptionSchema = new mongoose.Schema({ ... });
module.exports = mongoose.model('Prescription', prescriptionSchema);
```

---

### src/modules/clinics/clinic.routes.js
```javascript
const express = require('express');
const routes = express.Router();

// ✅ Controller do mesmo módulo (renomeado de clinicaController para clinicController)
const clinicController = require('./clinic.controller.js');

// ✅ Middlewares globais (suba 2 níveis)
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');

// ✅ Middlewares para todas as rotas
routes.use(authMiddleware.authenticateToken);
routes.use(limiter.generalLimiter);

// ✅ Rotas
routes.post('/', clinicController.createClinica);
routes.get('/me', clinicController.getMyClinica);

module.exports = routes;
```

---

### src/modules/clinics/clinic.controller.js
```javascript
const jwt = require('jsonwebtoken');
const { z } = require('zod');

// ✅ Model do mesmo módulo
const Clinica = require('./clinic.model.js');

// ✅ Model de outro módulo (referência cruzada permitida)
const User = require('../users/user.model.js');

// ✅ Exports de functions
exports.createClinica = async (req, res) => { ... };
exports.getMyClinica = async (req, res) => { ... };
```

---

### src/modules/clinics/clinic.model.js
```javascript
const mongoose = require('mongoose');

// ✅ Nenhum import local
const clinicSchema = new mongoose.Schema({ ... });
module.exports = mongoose.model('Clinic', clinicSchema);
```

---

### src/modules/waiting-line/waiting-line.routes.js
```javascript
const express = require('express');
const routes = express.Router();

// ✅ Controller do mesmo módulo
const waitingLineController = require('./waiting-line.controller.js');

// ✅ Middlewares globais (suba 2 níveis)
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');

// ✅ Middlewares para todas as rotas
routes.use(authMiddleware.authenticateToken);
routes.use(limiter.generalLimiter);

// ✅ Rotas
routes.post('/create', waitingLineController.createWaitingLineEntry);
routes.get('/list', waitingLineController.getWaitingLine);
routes.get('/:id', waitingLineController.getWaitingLineById);
routes.patch('/:id/call', waitingLineController.callPatient);
routes.patch('/:id/status', waitingLineController.updateWaitingLineStatus);
routes.patch('/:id/cancel', waitingLineController.cancelWaitingLine);

module.exports = routes;
```

---

### src/modules/waiting-line/waiting-line.controller.js
```javascript
const { z } = require('zod');

// ✅ Model do mesmo módulo
const WaitingLine = require('./waiting-line.model.js');

// ✅ Model de outro módulo (referência cruzada permitida)
const Patient = require('../patients/patient.model.js');

// ✅ Exports de functions
exports.createWaitingLineEntry = async (req, res) => { ... };
exports.getWaitingLine = async (req, res) => { ... };
exports.getWaitingLineById = async (req, res) => { ... };
exports.callPatient = async (req, res) => { ... };
exports.updateWaitingLineStatus = async (req, res) => { ... };
exports.cancelWaitingLine = async (req, res) => { ... };
```

---

### src/modules/waiting-line/waiting-line.model.js
```javascript
const mongoose = require('mongoose');

// ✅ Nenhum import local
const waitingLineSchema = new mongoose.Schema({ ... });
module.exports = mongoose.model('WaitingLine', waitingLineSchema);
```

---

### src/middlewares/auth.js
```javascript
const jwt = require('jsonwebtoken');

// ✅ Nenhum import local necessário
exports.authenticateToken = (req, res, next) => { ... };
```

---

### src/middlewares/rate-limit.js
```javascript
const rateLimit = require('express-rate-limit');

// ✅ Nenhum import local necessário
exports.generalLimiter = rateLimit({ ... });
exports.authLimiter = rateLimit({ ... });
```

---

## 🔍 TROUBLESHOOTING DE IMPORTS

### Erro: `Cannot find module './models'`
```javascript
// ❌ ERRADO (tenta buscar models/ que não existe mais)
const { User } = require('../models');

// ✅ CORRETO
const User = require('./user.model.js');
```

### Erro: `Cannot find module '../controllers/patient'`
```javascript
// ❌ ERRADO (controllers não existem mais)
const patientController = require('../controllers/patient');

// ✅ CORRETO
const patientController = require('./patient.controller.js');
```

### Erro: `Cannot find module '../../middlewares/auth'`
```javascript
// Verificar quantos níveis você precisa subir:
// src/modules/users/user.routes.js
//       ↓1       ↓2      (suba 2 vezes)
// ../../middlewares/auth.js ✅ CORRETO

// src/modules/patients/patient.controller.js
//       ↓1        ↓2 (suba 2 vezes)
// ../../middlewares/auth.js ✅ CORRETO
```

### Erro: Cross-module imports
```javascript
// src/modules/clinics/clinic.controller.js precisa de User?

// ✅ CORRETO (cruzar módulos é OK para negócio)
const User = require('../users/user.model.js');

// ❌ NÃO FAÇA (importar controllers/rotas é acoplamento)
const userController = require('../users/user.controller.js');
```

---

## 📝 Checklist de Imports

Para cada arquivo movido, verifique:

- [ ] Controllers importam seus models locais
- [ ] Routes importam seu controller local
- [ ] Routes importam middlewares com `../../middlewares/`
- [ ] Controllers de clínicas importam users se necessário
- [ ] Controllers de fila importam patients se necessário
- [ ] Nenhum arquivo importa outro controller
- [ ] Nenhum arquivo importa routes
- [ ] server.js importa todas as 4 rotas dos módulos

---

## 🚀 Copiar & Colar Rápido

Se você tiver pressa, aqui estão os imports prontos:

### Para user.controller.js:
```javascript
const User = require('./user.model.js');
```

### Para patient.controller.js:
```javascript
const Patient = require('./patient.model.js');
const MedicalRecord = require('./medicalRecord.model.js');
const Evolution = require('./evolution.model.js');
const Prescription = require('./prescription.model.js');
```

### Para clinic.controller.js:
```javascript
const Clinica = require('./clinic.model.js');
const User = require('../users/user.model.js');
```

### Para waiting-line.controller.js:
```javascript
const WaitingLine = require('./waiting-line.model.js');
const Patient = require('../patients/patient.model.js');
```

### Para qualquer routes.js:
```javascript
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');
```

---

## ✅ Validação Final

Após atualizar todos os imports, rode:

```bash
npm start
```

Você **não deve ver**:
- ❌ `Cannot find module`
- ❌ `Error: ENOENT`
- ❌ Erros de require

Você **deve ver**:
- ✅ `Conectado ao MongoDB`
- ✅ `Server is running on port 3000`

Se conseguir, parabéns! Todos os imports estão corretos! 🎉
