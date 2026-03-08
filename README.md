# Task Management System

## Project overview

- Django REST backend, minimal React (Vite) frontend.
- Multi-org: each user belongs to one organization; projects, tasks, and comments are scoped to that org.
- JWT auth (login, register, refresh). Users create projects and tasks, assign tasks to org members.
- Task statuses: todo, in_progress, done. Comments: add and view only.
- Who can do what is in Assumptions and Authentication below.

## Assumptions

- Each user has exactly one organization (via registration with `organization_id`).
- Task visibility: a user sees only tasks they created, are assigned to, or own the project for (so project owners can mark any task in their project as done, per assignment).
- Only the assignee can change status between todo and in_progress; only the assignee or project owner can mark a task as done (task creator cannot).
- Any org member can create tasks under org projects and set/change/remove assignee (assignee must be in same org).
- API docs (Swagger) and schema are public; all other APIs require authentication except login, register, and organization list.

## Trade-offs

- **Organizations** are created in Django admin only (no API). Keeps the API simple; an admin or superuser sets up orgs before users register.
- **Task visibility** is limited to tasks you created, are assigned to, or own the project for (not all org tasks). Chosen so project owners can see and mark tasks in their projects done without opening up the whole org task list.
- **One org per user.** Users can’t belong to multiple organizations; re-register or change org would require a new account or admin change.
- **Project/task delete** is blocked when a project has in-progress tasks or a task is in progress. Avoids orphaning; you must change status first.
- **JWT** is stored in the frontend (e.g. localStorage). Simple for a minimal frontend; for production you might use httpOnly cookies or short-lived tokens with refresh.

## Backend setup

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\Activate.ps1

# macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Creating organizations:** Organizations are not created via the API. After the backend is running, create them in Django admin:

1. Create a superuser: `python manage.py createsuperuser` (in the `backend` folder with venv active).
2. Open [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/) and log in.
3. Under **Organizations**, click **Add** and enter a name (e.g. "Acme Corp"). Save.
4. New users can then register and select this organization; existing orgs are listed at `GET /api/organizations/` and in the signup form.

## Frontend setup

Backend must be running first (so the frontend proxy can reach it).

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Login or register (pick an organization), then create projects, add tasks, assign, and add comments. If the app can't reach the API, set `VITE_API_URL` in a `.env` file (e.g. `VITE_API_URL=http://127.0.0.1:8000`). By default the dev server proxies `/api` to the backend. If something breaks, check the browser console and the terminal where the backend is running.

## API documentation

- **Swagger UI:** [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)
- **OpenAPI schema:** [http://127.0.0.1:8000/api/schema/](http://127.0.0.1:8000/api/schema/)

In Swagger you can try all endpoints. For protected ones, get a token first (see Auth below), then click **Authorize** and paste the access token.

## Authentication

- **Login:** `POST /api/token/` with body `{"username": "...", "password": "..."}`. Returns `access` and `refresh` (JWT).
- **Protected endpoints:** Send the access token in the header: `Authorization: Bearer <access_token>`.
- **Refresh:** `POST /api/token/refresh/` with body `{"refresh": "<refresh_token>"}` to get a new access token.
- **Register:** `POST /api/register/` with `username`, `password`, `organization_id`, and optional `email`. User is linked to that org.

Only authenticated users can call projects, tasks, comments, me, and users. Data is filtered by the user’s organization.

**Permissions:**

- Only authenticated users can access APIs.
- Users only access data belonging to their organization.
- Write access restricted by ownership/assignment: only the assignee can change status to todo/in_progress; only the assignee or project owner can mark a task as done.

## Main endpoints


| Endpoint                  | Auth | Description                                    |
| ------------------------- | ---- | ---------------------------------------------- |
| POST /api/token/          | No   | Login (get JWT)                                |
| POST /api/token/refresh/  | No   | Refresh access token                           |
| POST /api/register/       | No   | Register (org_id required)                     |
| GET /api/organizations/   | No   | List orgs (for signup)                         |
| GET /api/me/              | Yes  | Current user + org                             |
| GET /api/users/           | Yes  | Org members (for assignee)                     |
| /api/projects/            | Yes  | Projects CRUD (org-scoped)                     |
| /api/tasks/               | Yes  | Tasks CRUD (org-scoped), ?project=id to filter |
| /api/tasks/{id}/comments/ | Yes  | List/create comments                           |


