

###  Estrutura
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

