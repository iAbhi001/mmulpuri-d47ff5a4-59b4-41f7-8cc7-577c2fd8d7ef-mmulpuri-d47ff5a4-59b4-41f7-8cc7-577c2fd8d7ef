# TaskFlow — Secure Task Management System
### `mmulpuri-d47ff5a4-59b4-41f7-8cc7-577c2fd8d7ef`

A full-stack, role-based task management system built with **NestJS**, **Angular 17**, **NgRx**, **MongoDB (Mongoose)**, and **TailwindCSS** in an **NX monorepo**. Implements real JWT authentication, RBAC with org hierarchy, drag-and-drop task management, dark/light mode, and audit logging.

---

## 📦 Repository Structure

```
mmulpuri-d47ff5a4-59b4-41f7-8cc7-577c2fd8d7ef/
├── apps/
│   ├── api/                  → NestJS backend (REST API + RBAC + JWT)
│   │   └── src/
│   │       ├── auth/         → JWT auth (login, register with role resolution)
│   │       ├── tasks/        → Task CRUD with RBAC scoping
│   │       ├── audit/        → Audit logging (DB + console)
│   │       ├── organizations/→ 2-level org hierarchy
│   │       ├── users/        → User schema
│   │       └── common/       → Guards, decorators
│   └── dashboard/            → Angular 17 frontend (standalone components)
│       └── src/app/
│           ├── auth/         → Login + Register components + NgRx auth store
│           ├── tasks/        → Dashboard + NgRx tasks store
│           └── core/         → JWT interceptor, guards, theme service
├── libs/
│   ├── data/                 → Shared TypeScript interfaces, DTOs, enums
│   └── auth/                 → Reusable RBAC logic (role hierarchy, permissions)
├── .env.example
└── package.json
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js ≥ 18
- A MongoDB Atlas account (free tier works)
- npm ≥ 9

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
```
Edit `.env`:
```env
MONGODB_URI=mongodb+srv://dbuser:YOUR_PASSWORD@cluster0.aij2a.mongodb.net/task_management?appName=Cluster0
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=1d
NODE_ENV=development
API_PORT=3000
```

### 3. Run backend
```bash
npm run start:api
# API at http://localhost:3000/api
```
On first run, seeds 3 organizations: **Acme Corp** (parent), **Engineering** and **Marketing** (children).

### 4. Run frontend
```bash
npm run start:dashboard
# UI at http://localhost:4200
```

### 5. Run tests
```bash
npm run test:api
npm run test:dashboard
```

---

## 🔐 Authentication & Signup Flow

### Real JWT Authentication (no mocks)
- Passwords hashed with **bcrypt** (12 rounds)
- JWT signed with `JWT_SECRET`, verified on every request via `JwtStrategy`
- `JwtAuthGuard` applied globally — all routes protected by default
- `@Public()` decorator whitelists `/auth/login` and `/auth/register`
- Token attached to every HTTP request via Angular `authInterceptor`

### Signup Roles via Invite Code

| Code entered | Role granted | What happens |
|---|---|---|
| `1001` | **Owner** | Creates a brand-new organization; receives a 6-char invite code to share |
| Organization's invite code (e.g. `AB3X7K`) | **Admin** | Joins the matching organization |
| *(blank)* | **Viewer** | Selects an existing organization from a dropdown |

**Flow:**
1. Owner signs up with code `1001` + organization name → org created, invite code displayed once
2. Owner shares their org invite code with colleagues
3. Admin signs up with that invite code → auto-joined to the org
4. Viewer signs up with no code → picks org from list

---

## 🗄️ Data Model

### ERD
```
┌─────────────────────┐       ┌──────────────────────────┐
│    organizations    │       │          users            │
├─────────────────────┤       ├──────────────────────────┤
│ _id (ObjectId, PK)  │◄──┐   │ _id (ObjectId, PK)       │
│ name (unique)       │   │   │ email (unique)           │
│ parentId (FK→self)  │   └───│ organizationId (FK)      │
│ inviteCode          │       │ firstName, lastName       │
│ createdAt/updatedAt │       │ password (bcrypt)         │
└─────────────────────┘       │ role (owner|admin|viewer) │
         ▲                    └──────────────────────────┘
         │                               │
         │           ┌───────────────────┘
         │           ▼
         │    ┌──────────────────────────┐
         │    │          tasks           │
         │    ├──────────────────────────┤
         └────│ organizationId (FK)      │
              │ _id (ObjectId, PK)       │
              │ title, description       │
              │ status, category         │
              │ priority, dueDate        │
              │ ownerId (FK→users)       │
              └──────────────────────────┘

┌──────────────────────────────────────┐
│            audit_logs                │
├──────────────────────────────────────┤
│ _id, userId, action, resource        │
│ resourceId, details, ipAddress       │
│ success, createdAt                   │
└──────────────────────────────────────┘
```

---

## 🔑 Access Control

### Role Hierarchy
```
OWNER (3) → ADMIN (2) → VIEWER (1)
```

### Permission Matrix
| Action | VIEWER | ADMIN | OWNER |
|--------|--------|-------|-------|
| Create/read/update/delete own tasks | ✅ | ✅ | ✅ |
| Read ALL org tasks | ❌ | ✅ | ✅ |
| Update/delete ANY task in org | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ✅ | ✅ |
| Create organizations | ❌ | ❌ | ✅ |

### Org Scoping
- **Viewer** — own tasks only
- **Admin/Owner** — all tasks in their org + child orgs (recursive traversal)

---

## 📡 API Reference

Base URL: `http://localhost:3000/api`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register (role determined by invite code) |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET | `/tasks` | JWT | List tasks (scoped by role) |
| POST | `/tasks` | JWT | Create task |
| PUT | `/tasks/:id` | JWT | Update task |
| DELETE | `/tasks/:id` | JWT | Delete task |
| GET | `/audit-log` | Admin+ | View audit logs |
| GET | `/organizations` | Public | List orgs (for registration) |
| POST | `/organizations` | Owner | Create organization |

---

## 🧪 Tests

- `apps/api/src/auth/__tests__/rbac.spec.ts` — role hierarchy & permission checks
- `apps/api/src/auth/__tests__/auth.service.spec.ts` — login/register logic
- `apps/api/src/tasks/__tests__/tasks.service.spec.ts` — CRUD + RBAC enforcement
- `apps/dashboard/src/app/auth/__tests__/auth.reducer.spec.ts` — auth state
- `apps/dashboard/src/app/tasks/__tests__/tasks.reducer.spec.ts` — tasks state

---

## 🔭 Future Considerations

- JWT refresh tokens (short-lived access + httpOnly refresh cookie)
- CSRF protection via double-submit cookie
- Rate limiting on auth endpoints (`@nestjs/throttler`)
- Redis caching for permission lookups
- TypeORM migrations instead of `synchronize: true`
- Docker Compose setup
- OpenAPI/Swagger docs
