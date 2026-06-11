# 🚀 CHECKLIST DE EXECUÇÃO - Refatoração para Monólito Modular

Siga este checklist passo a passo para executar a refatoração com segurança.

---

## ✅ PRÉ-REFATORAÇÃO

- [ ] Fazer backup do projeto (git commit da versão atual)
- [ ] Ler completamente o REFACTORING_PLAN.md
- [ ] Verificar que não há mudanças não commitadas: `git status`
- [ ] Executar `npm start` para garantir que funciona atualmente

---

## 📁 FASE 1: Criar Estrutura de Diretórios

Na raiz de `backend/`, execute:

```bash
mkdir -p src/middlewares
mkdir -p src/modules/users
mkdir -p src/modules/patients
mkdir -p src/modules/clinics
mkdir -p src/modules/waiting-line
```

**Verificação:** 
```bash
tree src/
# Deve mostrar:
# src/
# ├── middlewares/
# ├── modules/
# │   ├── clinics/
# │   ├── patients/
# │   ├── users/
# │   └── waiting-line/
```

- [ ] Estrutura de pastas criada

---

## 🔐 FASE 2: Mover Middlewares

```bash
cp middlewares/auth.js src/middlewares/auth.js
cp middlewares/rate-limit.js src/middlewares/rate-limit.js
```

**Verificação:**
```bash
ls -la src/middlewares/
```

- [ ] `src/middlewares/auth.js` criado
- [ ] `src/middlewares/rate-limit.js` criado

---

## 👥 FASE 3: Mover Módulo USERS

### 3.1 - User Model
```bash
cp models/user.js src/modules/users/user.model.js
```

- [ ] `src/modules/users/user.model.js` criado

### 3.2 - User Controller

**Copiar:**
```bash
cp controllers/user.js src/modules/users/user.controller.js
```

**Editar:** `src/modules/users/user.controller.js`

Procure por:
```javascript
const { User } = require('../models');
```

Substitua por:
```javascript
const User = require('./user.model.js');
```

- [ ] `src/modules/users/user.controller.js` criado
- [ ] Imports atualizados em `user.controller.js`

### 3.3 - User Routes

**Copiar:**
```bash
cp routes/user.js src/modules/users/user.routes.js
```

**Editar:** `src/modules/users/user.routes.js`

**PASSO 1:** Atualizar imports
```javascript
// Remova estas linhas:
const patientController = require('../controllers/patient');

// Mude estas:
const userController = require('../controllers/user');
const authMiddleware = require('../middlewares/auth');
const limiter = require('../middlewares/rate-limit');

// Para estas:
const userController = require('./user.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');
```

**PASSO 2:** Remova todas as rotas de pacientes
Procure e DELETE todas estas linhas:
```javascript
routes.get('/patients/atendance-list', patientController.getPatients);
routes.post('/patients/register-patient', patientController.registerPatient);
routes.post('/patients/create-medical-record', patientController.medicalRecord);
routes.get('/patients/:patientId/get-medical-records', patientController.getMedicalRecords);
routes.post('/patients/create-evolution', patientController.evolution);
routes.get('/patients/:patientId/get-evolutions', patientController.getEvolutions);
routes.post('/patients/create-prescription', patientController.prescription);
routes.get('/patients/:patientId/get-prescriptions', patientController.getPrescriptions);
```

**Resultado final:** O arquivo deve ter apenas rotas de usuários e membros.

- [ ] `src/modules/users/user.routes.js` criado
- [ ] Imports atualizados
- [ ] Rotas de pacientes removidas

---

## 🏥 FASE 4: Mover Módulo PATIENTS

### 4.1 - Patient Models
```bash
cp models/patient.js src/modules/patients/patient.model.js
cp models/medicalRecord.js src/modules/patients/medicalRecord.model.js
cp models/evolution.js src/modules/patients/evolution.model.js
cp models/prescription.js src/modules/patients/prescription.model.js
```

- [ ] `patient.model.js` criado
- [ ] `medicalRecord.model.js` criado
- [ ] `evolution.model.js` criado
- [ ] `prescription.model.js` criado

### 4.2 - Patient Controller

```bash
cp controllers/patient.js src/modules/patients/patient.controller.js
```

**Editar:** `src/modules/patients/patient.controller.js`

Procure por:
```javascript
const { Patient, MedicalRecord, Evolution ,Prescription} = require('../models');
```

Substitua por:
```javascript
const Patient = require('./patient.model.js');
const MedicalRecord = require('./medicalRecord.model.js');
const Evolution = require('./evolution.model.js');
const Prescription = require('./prescription.model.js');
```

- [ ] `src/modules/patients/patient.controller.js` criado
- [ ] Imports atualizados

### 4.3 - Patient Routes (NOVO ARQUIVO)

**Crie um novo arquivo:** `src/modules/patients/patient.routes.js`

**Cole este conteúdo:**
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

- [ ] `src/modules/patients/patient.routes.js` criado e preenchido

---

## 🏢 FASE 5: Mover Módulo CLINICS

### 5.1 - Clinic Model
```bash
cp models/clinica.js src/modules/clinics/clinic.model.js
```

- [ ] `src/modules/clinics/clinic.model.js` criado

### 5.2 - Clinic Controller

```bash
cp controllers/clinica.js src/modules/clinics/clinic.controller.js
```

**Editar:** `src/modules/clinics/clinic.controller.js`

Procure por:
```javascript
const { Clinica, User } = require('../models');
```

Substitua por:
```javascript
const Clinica = require('./clinic.model.js');
const User = require('../users/user.model.js');
```

- [ ] `src/modules/clinics/clinic.controller.js` criado
- [ ] Imports atualizados

### 5.3 - Clinic Routes

```bash
cp routes/clinicas.js src/modules/clinics/clinic.routes.js
```

**Editar:** `src/modules/clinics/clinic.routes.js`

Procure por:
```javascript
const clinicaController = require('../controllers/clinica');
const authMiddleware = require('../middlewares/auth');
const limiter = require('../middlewares/rate-limit');
```

Substitua por:
```javascript
const clinicController = require('./clinic.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');
```

**Também atualize as referências ao controller:**
```javascript
// Mude de:
routes.post('/', clinicaController.createClinica);
routes.get('/me', clinicaController.getMyClinica);

// Para:
routes.post('/', clinicController.createClinica);
routes.get('/me', clinicController.getMyClinica);
```

- [ ] `src/modules/clinics/clinic.routes.js` criado
- [ ] Imports atualizados
- [ ] Referências de controller renomeadas

---

## ⏳ FASE 6: Mover Módulo WAITING-LINE

### 6.1 - Waiting Line Model
```bash
cp models/flow-clinic/waiting-line.js src/modules/waiting-line/waiting-line.model.js
```

- [ ] `src/modules/waiting-line/waiting-line.model.js` criado

### 6.2 - Waiting Line Controller

```bash
cp controllers/waiting-line.js src/modules/waiting-line/waiting-line.controller.js
```

**Editar:** `src/modules/waiting-line/waiting-line.controller.js`

Procure por:
```javascript
const { WaitingLine, Patient } = require('../models');
```

Substitua por:
```javascript
const WaitingLine = require('./waiting-line.model.js');
const Patient = require('../patients/patient.model.js');
```

- [ ] `src/modules/waiting-line/waiting-line.controller.js` criado
- [ ] Imports atualizados

### 6.3 - Waiting Line Routes

```bash
cp routes/waiting-line.js src/modules/waiting-line/waiting-line.routes.js
```

**Editar:** `src/modules/waiting-line/waiting-line.routes.js`

Procure por:
```javascript
const waitingLineController = require('../controllers/waiting-line');
const authMiddleware = require('../middlewares/auth');
const limiter = require('../middlewares/rate-limit');
```

Substitua por:
```javascript
const waitingLineController = require('./waiting-line.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');
```

- [ ] `src/modules/waiting-line/waiting-line.routes.js` criado
- [ ] Imports atualizados

---

## 🖥️ FASE 7: Atualizar server.js

**Copiar:**
```bash
cp server.js src/server.js
```

**Editar:** `src/server.js`

**PASSO 1:** Atualizar imports de rotas
Procure por:
```javascript
const waitingLineRoutes = require('./routes/waiting-line');
const clinicaRoutes = require('./routes/clinicas');
const routeUser = require('./routes/user');
```

Substitua por:
```javascript
const userRoutes = require('./modules/users/user.routes.js');
const patientRoutes = require('./modules/patients/patient.routes.js');
const clinicRoutes = require('./modules/clinics/clinic.routes.js');
const waitingLineRoutes = require('./modules/waiting-line/waiting-line.routes.js');
```

**PASSO 2:** Atualizar app.use() das rotas
Procure por:
```javascript
app.use('/api/users', routeUser);
app.use('/api/clinicas', clinicaRoutes);
app.use('/api/waiting-line', waitingLineRoutes);
```

Substitua por:
```javascript
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/waiting-line', waitingLineRoutes);
```

- [ ] `src/server.js` criado
- [ ] Imports de rotas atualizados
- [ ] app.use() das rotas atualizados

---

## 📦 FASE 8: Atualizar package.json

**Editar:** `package.json` (raiz de backend/)

Procure por:
```json
"scripts": {
  "start": "node --watch server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

Substitua por:
```json
"scripts": {
  "start": "node --watch src/server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

- [ ] Script `start` atualizado para `src/server.js`

---

## 🧹 FASE 9: Remover Arquivos Antigos

**IMPORTANTE:** Só remova após garantir que tudo funciona!

```bash
# Primeiro, teste se tudo funciona:
npm start
# Pressione Ctrl+C após confirmar que conecta ao MongoDB

# Depois, remova os antigos:
rm -rf controllers/
rm -rf models/
rm -rf routes/
rm -rf middlewares/
rm server.js
```

- [ ] Diretórios `controllers/`, `models/`, `routes/`, `middlewares/` deletados
- [ ] Arquivo `server.js` (raiz) deletado

---

## ✨ FASE 10: Validação Final

### 10.1 - Testar Inicialização

```bash
npm start
```

**Verificações esperadas:**
- ✅ Sem erros de `require()`
- ✅ Mensagem: "Conectado ao MongoDB"
- ✅ Mensagem: "Server is running on port 3000"

- [ ] Servidor inicia sem erros

### 10.2 - Testar Cada Rota (com Postman/Insomnia/curl)

**Rotas de Usuários:**
- [ ] POST `/api/users/register` → 201 ou 400 (expected)
- [ ] POST `/api/users/login` → 200 (se credenciais corretas)
- [ ] POST `/api/users/membros` → 201 ou 403 (sem auth)
- [ ] GET `/api/users/membros` → 200 ou 401 (sem auth)

**Rotas de Pacientes:**
- [ ] GET `/api/patients/atendance-list` → 200 ou 401 (sem auth)
- [ ] POST `/api/patients/register-patient` → 201 ou 401 (sem auth)
- [ ] GET `/api/patients/:id/get-medical-records` → 200 ou 401

**Rotas de Clínicas:**
- [ ] POST `/api/clinics/` → 201 ou 401 (sem auth)
- [ ] GET `/api/clinics/me` → 200 ou 404 (sem clinica)

**Rotas de Fila:**
- [ ] GET `/api/waiting-line/list` → 200 (pode estar vazio)
- [ ] POST `/api/waiting-line/create` → 201 ou 400/403

- [ ] Todas as rotas retornam status esperados

### 10.3 - Testar Autenticação

1. Faça login e obtenha o `accessToken`
2. Use o token em uma rota protegida (adicionar header: `Authorization: Bearer <token>`)
3. Verifique se a requisição autenticada funciona

- [ ] Autenticação funcionando

---

## 📝 COMMIT & DOCUMENTAÇÃO

Após passar em todas as validações:

```bash
git add .
git commit -m "refactor: reorganizar backend para arquitetura monolítica modular

- Estrutura vertical (controllers, models, routes) → horizontal por módulos
- Módulos: users, patients, clinics, waiting-line
- Middlewares globais movidos para src/middlewares/
- Todos os imports ajustados aos novos paths
- Nenhuma mudança em lógica de negócios ou segurança
- server.js movido para src/ com imports atualizados"

git log --oneline -3  # Ver os últimos commits
```

- [ ] Commit realizado com mensagem descritiva

---

## 🎯 PRÓXIMOS PASSOS (Opcional)

Considerações futuras:

- [ ] Adicionar `src/utils/` para código compartilhado
- [ ] Adicionar `src/config/` para configurações centralizadas
- [ ] Criar `src/validators/` para schemas Zod compartilhados
- [ ] Documentar estrutura em README
- [ ] Adicionar testes unitários por módulo

---

## 🆘 Troubleshooting

### ❌ Erro: `Cannot find module './models'`
**Solução:** Verifique se todos os imports foram atualizados. Procure por `require('../models')` em todos os arquivos movidos.

### ❌ Erro: `Cannot find module '../controllers/patient'`
**Solução:** Você esqueceu de remover o import de `patientController` em `user.routes.js` ou não atualizou `patient.routes.js`.

### ❌ Erro: `Cannot find module '../../middlewares/auth'`
**Solução:** Verifique o path relativo. Se o arquivo está em `src/modules/users/`, então `../../middlewares/` está correto.

### ❌ Rotas retornam 404
**Solução:** Verifique se em `src/server.js` você está usando os paths corretos nas linhas `app.use()`.

### ❌ Autenticação não funciona
**Solução:** Certifique-se que `src/middlewares/auth.js` foi copiado corretamente e que as rotas aplicam `authMiddleware.authenticateToken`.

---

## ✅ Checklist Completo!

Se você marcou todas as checkboxes acima, parabéns! 🎉

Você realizou com sucesso a refatoração da arquitetura do seu backend mantendo 100% da funcionalidade intacta.
