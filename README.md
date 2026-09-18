# Brex Interview Playground

A local full-stack starter for building REST APIs and UI features.

## Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, and standard `fetch` requests.
- **Backend:** Python, FastAPI, Pydantic, and SQLAlchemy.
- **Database:** SQLite.

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

## Development guides

- [Backend](backend-python/README.md): REST endpoints, request examples, Python modules, database lifecycle, and development tools.
- [Frontend](frontend/README.md): React components, state and request flow, API integration, and type checks.

Before adding data you want to keep, review the [database reset behavior](backend-python/README.md#database).

## Working with coding agents

Start agent sessions in this repository root. [AGENTS.md](AGENTS.md) defines the working rules. Use Plan mode to agree on the approach for larger changes. When work may continue in a new session, save the agreed plan and progress under `docs/features/` using [the optional feature template](docs/features/_template.md). Record completed changes in the [changelog](CHANGELOG.md).
