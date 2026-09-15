# Interview frontend: React + REST

The dashboard uses the Python backend's REST API with standard `fetch` calls.

## Run locally

Start the backend in one terminal, from the repository root:

```sh
cd backend-python
poetry run uvicorn src.app.main:app --reload --port 8080
```

Start the frontend in another terminal, from the repository root:

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. Interactive REST API docs are at http://localhost:8080/docs.

## Add an API or feature

| File | Purpose |
| --- | --- |
| `../backend-python/src/app/api/rest/messages.py` | REST routes: HTTP methods, paths, and database operations |
| `../backend-python/src/app/schemas/message.py` | Pydantic models: JSON request validation and response fields |
| `../backend-python/src/app/models/message.py` | SQLAlchemy model: database table and columns |
| `../backend-python/src/app/main.py` | App setup; register additional routers here |
| `src/lib/api.ts` | TypeScript response types and REST requests |
| `src/components/HelloWorldDashboard.tsx` | Page behavior and rendering |

For a new feature, add the backend route and schemas, try the request in `/docs`, then add a function in `api.ts` and call it from the UI.

The dashboard currently uses:

- `GET /api/messages/latest/?limit=10` to load recent messages.
- `POST /api/messages/` with JSON `{"content":"Hello World"}` to create a message, followed by a refresh of the list.

REST responses use `created_at` for the timestamp. Request failures appear on the dashboard.

## Database behavior

The Python backend uses SQLite at `backend-python/dummy.db` when launched from that directory. The boilerplate recreates its tables and seeds a Hello World message on every backend start, including reloads after code edits.

## Check frontend types

```sh
npm run typecheck
```
