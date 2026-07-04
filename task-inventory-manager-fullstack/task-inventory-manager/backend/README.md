# Task & Inventory Manager — Python (FastAPI) Backend

Drop-in replacement for the Node.js/Express backend, rebuilt with **FastAPI** while keeping
the same feature set: JWT auth, role-based access control (RBAC), MongoDB persistence, and
Docker deployment. Pairs with the existing React frontend unchanged (same REST contract,
`/api/...` routes).

## Stack

- **FastAPI** + **Uvicorn** (ASGI)
- **Motor** (async MongoDB driver) + **PyMongo**
- **python-jose** for JWT signing/verification
- **passlib[bcrypt]** for password hashing
- **Pydantic v2** for request/response validation
- **Docker** + **docker-compose** (API + MongoDB)

## Project structure

```
task-inventory-backend-python/
├── main.py                  # FastAPI app, router wiring, CORS, lifespan
├── app/
│   ├── config.py             # env-based settings
│   ├── database.py           # Motor client, indexes
│   ├── schemas/               # Pydantic request/response models
│   │   ├── user.py
│   │   ├── task.py
│   │   └── inventory.py
│   ├── routers/
│   │   ├── auth.py            # register / login / refresh / me
│   │   ├── users.py           # admin user management
│   │   ├── tasks.py           # task CRUD
│   │   └── inventory.py       # inventory CRUD + stock adjustment
│   └── utils/
│       ├── security.py        # hashing, JWT create/decode
│       └── deps.py            # get_current_user, require_roles (RBAC)
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Auth & RBAC design

- Roles: `admin`, `manager`, `user` (extendable in `app/schemas/user.py`).
- Passwords hashed with bcrypt via passlib.
- Login/register return a short-lived **access token** (60 min default) and a longer-lived
  **refresh token** (7 days default), matching the original JWT session model.
- `require_roles("admin", "manager")` is used as a FastAPI dependency to gate write
  operations — e.g. only admin/manager can create, edit, or delete inventory items;
  only admins can manage user roles.
- Tasks use ownership-based access: regular users only see/manage tasks they own or are
  assigned to; admins/managers see everything.

> Note: the original resume bullet also mentioned Firebase Authentication. This rebuild
> uses self-issued JWTs (matching the "JWT-based session management" bullet) rather than
> Firebase, since Firebase Admin SDK verification would sit alongside — not replace — this
> backend. Let me know if you'd like Firebase ID-token verification layered in as well.

## Setup (local, no Docker)

```bash
cd task-inventory-backend-python
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set MONGO_URI (e.g. a local Mongo or Atlas URI) and a strong JWT_SECRET

uvicorn main:app --reload --port 8000
```

API docs (Swagger UI) will be live at `http://localhost:8000/docs`.

## Setup with Docker

```bash
docker-compose up --build
```

This starts the FastAPI API on `:8000` and a MongoDB container on `:27017`.

## API endpoints

### Auth — `/api/auth`
| Method | Path | Access |
|---|---|---|
| POST | `/register` | Public |
| POST | `/login` | Public |
| POST | `/refresh` | Public (valid refresh token) |
| GET | `/me` | Authenticated |

### Users — `/api/users` (admin only)
| Method | Path |
|---|---|
| GET | `/` |
| PATCH | `/{user_id}/role` |
| DELETE | `/{user_id}` |

### Tasks — `/api/tasks`
| Method | Path | Access |
|---|---|---|
| POST | `/` | Authenticated |
| GET | `/` | Authenticated (scoped by role) |
| GET | `/{task_id}` | Owner / assignee / admin / manager |
| PUT | `/{task_id}` | Owner / assignee / admin / manager |
| DELETE | `/{task_id}` | Owner / admin / manager |

### Inventory — `/api/inventory`
| Method | Path | Access |
|---|---|---|
| POST | `/` | admin / manager |
| GET | `/` | Authenticated |
| GET | `/low-stock` | Authenticated |
| GET | `/{item_id}` | Authenticated |
| PUT | `/{item_id}` | admin / manager |
| PATCH | `/{item_id}/stock` | admin / manager |
| DELETE | `/{item_id}` | admin / manager |

## Connecting the existing React frontend

No frontend changes needed if it already talks to `/api/auth`, `/api/tasks`,
`/api/inventory` — this backend mirrors those same routes and JSON shapes
(`access_token` / `refresh_token` / `user` on login, `id` instead of Mongo's `_id`
in all responses).

Set the frontend's API base URL to wherever this service is deployed
(e.g. `http://localhost:8000` locally, or your Cloud Run URL in production).

## Deployment notes (GCP Cloud Run)

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/task-inventory-api
gcloud run deploy task-inventory-api \
  --image gcr.io/PROJECT_ID/task-inventory-api \
  --platform managed \
  --set-env-vars MONGO_URI=<your-mongo-atlas-uri>,JWT_SECRET=<strong-secret> \
  --allow-unauthenticated
```

Use a managed MongoDB (e.g. MongoDB Atlas) for production rather than the
docker-compose Mongo container, which is for local dev only.
