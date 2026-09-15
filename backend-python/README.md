# Python REST backend

FastAPI serves REST endpoints, Pydantic validates JSON requests and responses, and SQLAlchemy reads and writes a local SQLite database.

## Run

From this directory, with Python 3.14 and Poetry installed:

```sh
poetry env use python3.14
poetry install
poetry run uvicorn src.app.main:app --reload --port 8080
```

Open http://localhost:8080/docs to explore and try the endpoints.

## REST endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/messages/` | List messages; accepts `skip` and `limit` |
| GET | `/api/messages/latest/` | List newest messages first; accepts `limit` |
| GET | `/api/messages/{message_id}` | Get a message by UUID |
| POST | `/api/messages/` | Create a message from JSON `{"content":"Hello World"}` |

Message responses contain `id`, `content`, and `created_at`.

```sh
curl 'http://localhost:8080/api/messages/latest/?limit=10'
curl -X POST 'http://localhost:8080/api/messages/' \
  -H 'Content-Type: application/json' \
  -d '{"content":"My first REST message"}'
```

## Where to work

- `src/app/api/messages.py`: route handlers and database operations.
- `src/app/schemas/message.py`: Pydantic request/response models.
- `src/app/models/message.py`: SQLAlchemy table definition.
- `src/app/database/session.py`: SQLite connection and request sessions.
- `src/app/database/seed.py`: initial sample data.
- `src/app/main.py`: app setup, CORS, and router registration.

Register new routers in `main.py` with `app.include_router(...)`.

## Database

The URL `sqlite:///./dummy.db` resolves relative to the server's working directory. Run from `backend-python` to use its `dummy.db` file.

The starter drops and recreates its tables, then seeds one Hello World message on every start. Automatic reloads also reset the data.

## Development tools

```sh
poetry run black src
poetry run isort src
poetry run mypy src
```
