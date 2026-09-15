# Brex Interview Playground

A local full-stack starter for building REST APIs and UI features.

## Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, and standard `fetch` requests.
- **Backend:** Python, FastAPI, Pydantic, and SQLAlchemy.
- **Database:** SQLite, stored in `backend-python/dummy.db` when the server starts from that directory.

## Setup

Use Python 3.14, Poetry, and Node.js 20 or later.

Start the backend from the repository root:

```sh
cd backend-python
poetry env use python3.14
poetry install
poetry run uvicorn src.app.main:app --reload --port 8080
```

In another terminal, start the frontend from the repository root:

```sh
cd frontend
npm install
npm run dev
```

- App: http://localhost:3000
- Interactive REST API docs: http://localhost:8080/docs
- OpenAPI schema: http://localhost:8080/openapi.json

The frontend expects the backend at `http://localhost:8080/api`. The backend allows browser requests from `http://localhost:3000`.

## Project structure

```text
backend-python/
  src/app/
    main.py                  App setup and router registration
    api/rest/messages.py     REST endpoints
    schemas/message.py       JSON request/response models
    models/message.py        Database table definition
    database/                Connection setup and seed data
frontend/
  src/
    app/                     Page entry point and layout
    components/              React UI components
    lib/api.ts               REST requests and TypeScript response types
```

## Implementing features

1. Add or change a database model if the feature needs new stored data.
2. Define Pydantic request/response models and implement a REST endpoint.
3. Exercise the endpoint using `/docs`.
4. Add a request function and response type in `frontend/src/lib/api.ts`.
5. Call it from a React component and handle loading, success, and errors.

See the [backend guide](backend-python/README.md) and [frontend guide](frontend/README.md) for details.

## Database lifecycle

The starter drops and recreates its tables on every backend start and inserts one Hello World message. This includes automatic restarts caused by `--reload`. Data changes therefore do not survive a backend restart.

## Frontend checks

From `frontend`:

```sh
npm run typecheck
```
