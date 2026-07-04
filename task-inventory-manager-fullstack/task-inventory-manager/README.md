# Manifest — Task & Inventory Manager (Full Stack, Python backend)

A complete rebuild of the Task & Inventory Manager: **React** frontend + **FastAPI**
(Python) backend + **MongoDB**, with JWT auth, role-based access control (RBAC), and
Docker deployment for both services.

```
task-inventory-manager/
├── docker-compose.yml     # runs mongo + backend + frontend together
├── backend/               # FastAPI REST API (see backend/README.md)
└── frontend/              # React (Vite) SPA
```

## Quick start (Docker, everything at once)

From the project root:

```bash
docker-compose up --build
```

- Frontend: http://localhost:8080
- Backend API + docs: http://localhost:8000/docs
- MongoDB: localhost:27017

Set a real `JWT_SECRET` for anything beyond local testing:

```bash
JWT_SECRET=$(openssl rand -hex 32) docker-compose up --build
```

## Quick start (local dev, no Docker)

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # point MONGO_URI at a local/Atlas Mongo instance
uvicorn main:app --reload --port 8000
```

**Frontend** (separate terminal)
```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Frontend runs at http://localhost:5173 and talks to the backend at
`http://localhost:8000`.

## What's included

**Auth & RBAC**
- Register / login / JWT access + refresh tokens / session restore on page reload
- Three roles: `admin`, `manager`, `user`
- Role-gated UI: only admin/manager can create/edit/delete inventory or manage users;
  regular users only see and manage their own or assigned tasks

**Tasks**
- Full CRUD, status (`todo` / `in progress` / `done`) and priority
- Click a task's status pill to cycle it forward
- Filter by status

**Inventory**
- Full CRUD, SKU-based, category, unit price, reorder level
- Inline +/− stock adjustment
- Low-stock filter and highlighting

**Admin**
- Team/user list, role changes, account removal (admin-only)

## Design notes

The frontend uses a distinct "manifest / ledger" visual language — navy ink on cool
paper, amber warehouse-tag accents, monospace SKUs and stamped role badges — rather
than a generic dashboard template. See `frontend/src/styles/global.css` for the design
tokens.

## Deploying

- **Backend** → GCP Cloud Run (see `backend/README.md` for the `gcloud` commands);
  point `MONGO_URI` at a managed MongoDB (e.g. Atlas) in production.
- **Frontend** → Vercel (as in the original resume bullet), or as the `frontend`
  Docker image (nginx-served static build) anywhere else. Set `VITE_API_BASE_URL`
  to your deployed backend URL at build time.

## On Firebase Auth

The original project description mentioned Firebase Authentication alongside
JWT-based sessions. This build uses self-issued JWTs end-to-end (register/login
issue the tokens directly), which is what actually implements "JWT-based session
management." If you want Firebase ID-token verification layered in on top, that's a
separate addition to `backend/app/utils/deps.py` — say the word and I'll add it.
