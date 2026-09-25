import uuid

from fastapi.testclient import TestClient

from src.app.database.session import get_db
from src.app.main import app
from src.app.models.account import Account

STARTING_BALANCE_CENTS = 100_000
SEED_ACCOUNT_NAMES = {"Alice", "Bob", "Carol", "Dave"}


def test_list_accounts_returns_seeded_accounts_with_balances(seeded_client: TestClient):
    response = seeded_client.get("/api/accounts/")

    assert response.status_code == 200
    accounts = response.json()
    assert {account["name"] for account in accounts} == SEED_ACCOUNT_NAMES
    assert len(accounts) == len(SEED_ACCOUNT_NAMES)
    for account in accounts:
        assert account["balance_cents"] == STARTING_BALANCE_CENTS


def test_get_account_returns_correct_account(seeded_client: TestClient):
    accounts = seeded_client.get("/api/accounts/").json()
    target = accounts[0]

    response = seeded_client.get(f"/api/accounts/{target['id']}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == target["id"]
    assert body["name"] == target["name"]
    assert body["balance_cents"] == STARTING_BALANCE_CENTS


def test_get_account_404_for_unknown_id(seeded_client: TestClient):
    response = seeded_client.get(f"/api/accounts/{uuid.uuid4()}")

    assert response.status_code == 404


def test_list_accounts_empty_database_returns_empty_list(client: TestClient):
    response = client.get("/api/accounts/")

    assert response.status_code == 200
    assert response.json() == []


def test_account_with_no_ledger_entries_has_zero_balance(client: TestClient):
    db_gen = app.dependency_overrides[get_db]()
    db = next(db_gen)
    try:
        account = Account(name="Empty")
        db.add(account)
        db.commit()
        db.refresh(account)
        account_id = account.id
    finally:
        db_gen.close()

    response = client.get(f"/api/accounts/{account_id}")

    assert response.status_code == 200
    assert response.json()["balance_cents"] == 0
