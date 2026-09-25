# Python REST backend

FastAPI serves REST endpoints, Pydantic validates JSON requests and responses, and SQLAlchemy reads and writes a local SQLite database.

See the [root setup instructions](../README.md#setup) to install dependencies and start the servers.

## REST endpoints

Open http://localhost:8080/docs to explore and try the endpoints.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/accounts/` | List all accounts with their current computed balance |
| GET | `/api/accounts/{account_id}` | Get a single account by UUID; 404 if unknown |

Account responses contain `id`, `name`, `balance_cents`, and `created_at`. `balance_cents` is always computed as the sum of the account's ledger entries (see [Data model](#data-model)) — there is no stored balance column.

```sh
curl 'http://localhost:8080/api/accounts/'
```

This is a peer-to-peer transfer demo; see [docs/features/001-p2p-transfer-service.md](../docs/features/001-p2p-transfer-service.md) for the full design and the transfer/transfer-log endpoints landing in later checkpoints.

## Data model

- **`Account`**: `id`, `name`, timestamps. No balance column.
- **`Transfer`**: one row per peer-to-peer transfer (`from_account_id`, `to_account_id`, `amount_cents`, `idempotency_key`). Insert-only.
- **`LedgerEntry`**: the source of truth for balances. Two signed rows per transfer (a debit and a credit), plus one unlinked seed-funding entry per account. Insert-only. An account's balance is `SUM(ledger_entries.amount_cents)` for that account.

## Where to work

- `src/app/api/accounts.py`: route handlers and balance computation.
- `src/app/schemas/account.py`: Pydantic request/response models.
- `src/app/models/account.py`, `models/transfer.py`, `models/ledger_entry.py`: SQLAlchemy table definitions.
- `src/app/database/session.py`: SQLite connection and request sessions.
- `src/app/database/seed.py`: seeds 4 demo accounts, each with a $1000 starting ledger entry.
- `src/app/main.py`: app setup, CORS, and router registration.

Register new routers in `main.py` with `app.include_router(...)`.

For a new API feature, update the database model if needed, define the request/response schemas, implement the route, and test it in `/docs`. See the [frontend integration guide](../frontend/README.md#adding-a-ui-feature) to connect it to the UI.

The CORS configuration in `main.py` allows browser requests from `http://localhost:3000`.

## Database

The URL `sqlite:///./dummy.db` resolves relative to the server's working directory. Run from `backend-python` to use its `dummy.db` file.

The starter drops and recreates its tables, then seeds 4 demo accounts (Alice, Bob, Carol, Dave) with a $1000 starting balance each on every start. Automatic reloads also reset the data.

Set `DATABASE_URL` to a different SQLite URL when you need an isolated database. For example, `DATABASE_URL=sqlite:////tmp/brex-interview.db poetry run uvicorn src.app.main:app --reload --port 8080` keeps the tracked `dummy.db` untouched.

## Development tools

Run from `backend-python`:

```sh
poetry run pytest
poetry run black src
poetry run isort src
poetry run mypy src
```

The pytest fixture uses a temporary database before importing the app, then a separate database for each test client.
