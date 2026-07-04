Task & Inventory Manager

A full-stack CRUD web application for managing tasks and inventory, with JWT authentication, role-based access control (RBAC), and Docker-based deployment.

Built with a React frontend and a Python (FastAPI) REST API backend, backed by MongoDB.


Table of contents


Features
Tech stack
Project structure
Getting started

Option 1: Docker (recommended)
Option 2: Run locally without Docker



Environment variables
API overview
Roles & permissions
Screenshots
Deployment
Design notes
Roadmap / possible extensions
License



Features

Authentication


Email/password registration and login
JWT access tokens (short-lived) + refresh tokens (long-lived), with automatic silent refresh on the frontend
Session restore on page reload (no re-login needed until refresh token expires)


Role-based access control (RBAC)


Three roles: admin, manager, user
Admins manage team members and roles
Admins/managers have full inventory write access; regular users get read-only inventory access
Regular users only see and manage tasks they own or are assigned to; admins/managers see everything


Task management


Create, read, update, delete tasks
Status (To do → In progress → Done) with one-click cycling
Priority levels (Low / Medium / High)
Optional due dates
Filter by status


Inventory management


Create, read, update, delete inventory items
SKU-based, with category, unit price, and reorder level
Inline stock adjustment (+ / −) with insufficient-stock protection
Automatic low-stock flagging and a low-stock-only filter


Engineering


Fully async backend (Motor + FastAPI)
Pydantic v2 request/response validation throughout
Dockerized frontend and backend, with a single docker-compose.yml to run the whole stack plus MongoDB
Same REST contract regardless of how you deploy (local, Docker, or cloud)



Tech stack

LayerTechnologyFrontendReact 18, Vite, React Router, AxiosBackendPython 3.11, FastAPI, UvicornDatabaseMongoDB (Motor async driver)AuthJWT (python-jose), bcrypt password hashing (passlib)ContainerizationDocker, Docker Compose, nginx (frontend production serving)Deployment targetsVercel / nginx (frontend), GCP Cloud Run (backend), MongoDB Atlas (database)


Project structure

task-inventory-manager/
├── docker-compose.yml          # runs mongo + backend + frontend together
├── README.md                   # you are here
│
├── backend/                    # FastAPI REST API
│   ├── main.py                 # app entrypoint, router wiring, CORS, lifespan
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml      # standalone backend+mongo compose (optional)
│   ├── .env.example
│   ├── README.md               # backend-specific docs
│   └── app/
│       ├── config.py            # environment-based settings
│       ├── database.py          # Motor client + index setup
│       ├── schemas/             # Pydantic request/response models
│       │   ├── user.py
│       │   ├── task.py
│       │   └── inventory.py
│       ├── routers/
│       │   ├── auth.py          # register / login / refresh / me
│       │   ├── users.py         # admin user management
│       │   ├── tasks.py         # task CRUD
│       │   └── inventory.py     # inventory CRUD + stock adjustment
│       └── utils/
│           ├── security.py      # hashing, JWT create/decode
│           └── deps.py          # get_current_user, require_roles (RBAC)
│
└── frontend/                    # React (Vite) SPA
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── Dockerfile                # multi-stage build → nginx
    ├── nginx.conf
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx                # routes
        ├── api/
        │   ├── client.js          # axios instance, token attach + auto-refresh
        │   └── endpoints.js       # grouped API calls
        ├── context/
        │   └── AuthContext.jsx    # auth state, login/register/logout
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── RoleBadge.jsx
        │   ├── Modal.jsx
        │   ├── TaskCard.jsx / TaskForm.jsx
        │   └── InventoryRow.jsx / InventoryForm.jsx
        ├── pages/
        │   ├── Login.jsx / Register.jsx
        │   ├── DashboardLayout.jsx
        │   ├── TasksPage.jsx
        │   ├── InventoryPage.jsx
        │   └── UsersPage.jsx      # admin only
        └── styles/                # modular CSS per page/component


Getting started

Option 1: Docker (recommended)

Requires Docker Desktop installed and running.

bashgit clone https://github.com/HarshaVelagala/task-inventory-manager.git
cd task-inventory-manager
docker compose up --build


Use docker compose (space) on modern Docker Desktop installs, or docker-compose (hyphen) if you're on the older standalone Compose binary.



Once it's up:

ServiceURLFrontendhttp://localhost:8080Backend APIhttp://localhost:8000Interactive API docs (Swagger)http://localhost:8000/docsMongoDBlocalhost:27017

Set a real secret for anything beyond a quick local test:

bashJWT_SECRET=$(openssl rand -hex 32) docker compose up --build

Option 2: Run locally without Docker

Backend

bashcd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # edit MONGO_URI and JWT_SECRET as needed
uvicorn main:app --reload --port 8000

You'll need a MongoDB instance running — either locally (mongod) or a free MongoDB Atlas cluster, with its connection string set as MONGO_URI in .env.

Frontend (in a second terminal)

bashcd frontend
npm install
cp .env.example .env            # VITE_API_BASE_URL=http://localhost:8000
npm run dev

Frontend runs at http://localhost:5173.


Environment variables

backend/.env

VariableDescriptionDefaultMONGO_URIMongoDB connection stringmongodb://localhost:27017MONGO_DB_NAMEDatabase nametask_inventory_dbJWT_SECRETSecret used to sign JWTs — change this in productionchange-this-secret-in-productionJWT_ALGORITHMJWT signing algorithmHS256ACCESS_TOKEN_EXPIRE_MINUTESAccess token lifetime60REFRESH_TOKEN_EXPIRE_DAYSRefresh token lifetime7CORS_ORIGINSComma-separated list of allowed frontend originshttp://localhost:3000,http://localhost:5173

frontend/.env

VariableDescriptionDefaultVITE_API_BASE_URLURL of the backend APIhttp://localhost:8000


API overview

Full interactive docs are auto-generated by FastAPI at /docs once the backend is running. Summary:

Auth — /api/auth

MethodPathAccessPOST/registerPublicPOST/loginPublicPOST/refreshPublic (valid refresh token)GET/meAuthenticated

Users — /api/users

MethodPathAccessGET/AdminPATCH/{user_id}/roleAdminDELETE/{user_id}Admin

Tasks — /api/tasks

MethodPathAccessPOST/AuthenticatedGET/Authenticated (scoped by role)GET/{task_id}Owner / assignee / admin / managerPUT/{task_id}Owner / assignee / admin / managerDELETE/{task_id}Owner / admin / manager

Inventory — /api/inventory

MethodPathAccessPOST/Admin / managerGET/AuthenticatedGET/low-stockAuthenticatedGET/{item_id}AuthenticatedPUT/{item_id}Admin / managerPATCH/{item_id}/stockAdmin / managerDELETE/{item_id}Admin / manager


Roles & permissions

ActionUserManagerAdminView own/assigned tasks✅✅✅View all tasks❌✅✅Create/edit own tasks✅✅✅Edit/delete any task❌✅✅View inventory✅✅✅Create/edit/delete inventory❌✅✅Adjust stock❌✅✅Manage user roles❌❌✅Remove user accounts❌❌✅

New sign-ups always start as user; promote them to manager or admin from the Users page (admin-only).


Screenshots


Add screenshots or a short demo GIF here once you've run the app — e.g. the task board, the inventory ledger, and the login screen.



docs/
├── screenshot-login.png
├── screenshot-tasks.png
└── screenshot-inventory.png


Deployment

Frontend → Vercel

bashcd frontend
vercel --prod

Set VITE_API_BASE_URL as an environment variable in the Vercel project settings, pointing to your deployed backend URL.

Backend → GCP Cloud Run

bashcd backend
gcloud builds submit --tag gcr.io/PROJECT_ID/task-inventory-api
gcloud run deploy task-inventory-api \
  --image gcr.io/PROJECT_ID/task-inventory-api \
  --platform managed \
  --set-env-vars MONGO_URI=<your-mongo-atlas-uri>,JWT_SECRET=<strong-secret> \
  --allow-unauthenticated

Database → MongoDB Atlas
Use a managed MongoDB cluster in production rather than the docker-compose Mongo container, which is intended for local development only.


Design notes

The frontend uses a "manifest / ledger" visual identity — navy ink on cool paper, amber warehouse-tag accents, monospace SKUs, and stamped role badges — rather than a generic dashboard template. Design tokens live in frontend/src/styles/global.css.

On Firebase Auth: earlier drafts of this project's description mentioned Firebase Authentication alongside JWT sessions. This implementation uses self-issued JWTs end-to-end (register/login issue the tokens directly), which is what actually implements "JWT-based session management." Firebase ID-token verification could be layered on top as an additional auth provider if needed — see backend/app/utils/deps.py.


Roadmap / possible extensions


 Automated tests (pytest for backend, Vitest/RTL for frontend)
 GitHub Actions CI (lint, test, build on every PR)
 Pagination and search for tasks/inventory
 Activity log / audit trail for inventory stock changes
 Email notifications for low stock or task due dates
 Dark mode



License

This project is available for personal and educational use. Add a formal license (e.g. MIT) here if you plan to open-source it.
