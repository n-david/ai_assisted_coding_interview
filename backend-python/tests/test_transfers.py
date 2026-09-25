import threading
import uuid
from typing import Dict, Optional

from fastapi.testclient import TestClient

STARTING_BALANCE_CENTS = 100_000


def _accounts_by_name(client: TestClient) -> Dict[str, dict]:
    accounts = client.get("/api/accounts/").json()
    return {account["name"]: account for account in accounts}


def _transfer(
    client: TestClient,
    from_id: str,
    to_id: str,
    amount_cents: int,
    idempotency_key: Optional[str] = None,
):
    return client.post(
        "/api/transfers/",
        json={
            "from_account_id": from_id,
            "to_account_id": to_id,
            "amount_cents": amount_cents,
        },
        headers={"Idempotency-Key": idempotency_key or str(uuid.uuid4())},
    )


def test_transfer_happy_path_debits_sender_credits_receiver(seeded_client: TestClient):
    accounts = _accounts_by_name(seeded_client)
    alice, bob = accounts["Alice"], accounts["Bob"]

    response = _transfer(seeded_client, alice["id"], bob["id"], 25_000)

    assert response.status_code == 201
    body = response.json()
    assert body["from_account_id"] == alice["id"]
    assert body["to_account_id"] == bob["id"]
    assert body["amount_cents"] == 25_000

    updated = _accounts_by_name(seeded_client)
    assert updated["Alice"]["balance_cents"] == STARTING_BALANCE_CENTS - 25_000
    assert updated["Bob"]["balance_cents"] == STARTING_BALANCE_CENTS + 25_000


def test_transfer_amount_must_be_positive(seeded_client: TestClient):
    accounts = _accounts_by_name(seeded_client)
    alice, bob = accounts["Alice"], accounts["Bob"]

    response = _transfer(seeded_client, alice["id"], bob["id"], 0)

    assert response.status_code == 422


def test_self_transfer_is_rejected(seeded_client: TestClient):
    accounts = _accounts_by_name(seeded_client)
    alice = accounts["Alice"]

    response = _transfer(seeded_client, alice["id"], alice["id"], 1_000)

    assert response.status_code == 400


def test_insufficient_funds_rejected_and_balances_unchanged(seeded_client: TestClient):
    accounts = _accounts_by_name(seeded_client)
    alice, bob = accounts["Alice"], accounts["Bob"]

    response = _transfer(seeded_client, alice["id"], bob["id"], STARTING_BALANCE_CENTS + 1)

    assert response.status_code == 400
    updated = _accounts_by_name(seeded_client)
    assert updated["Alice"]["balance_cents"] == STARTING_BALANCE_CENTS
    assert updated["Bob"]["balance_cents"] == STARTING_BALANCE_CENTS


def test_missing_account_is_rejected(seeded_client: TestClient):
    accounts = _accounts_by_name(seeded_client)
    alice = accounts["Alice"]
    unknown_id = str(uuid.uuid4())

    assert _transfer(seeded_client, alice["id"], unknown_id, 1_000).status_code == 404
    assert _transfer(seeded_client, unknown_id, alice["id"], 1_000).status_code == 404


def test_idempotent_replay_does_not_reexecute(seeded_client: TestClient):
    accounts = _accounts_by_name(seeded_client)
    alice, bob = accounts["Alice"], accounts["Bob"]
    key = str(uuid.uuid4())

    first = _transfer(seeded_client, alice["id"], bob["id"], 10_000, idempotency_key=key)
    second = _transfer(seeded_client, alice["id"], bob["id"], 10_000, idempotency_key=key)

    assert first.status_code == 201
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]

    updated = _accounts_by_name(seeded_client)
    assert updated["Alice"]["balance_cents"] == STARTING_BALANCE_CENTS - 10_000
    assert updated["Bob"]["balance_cents"] == STARTING_BALANCE_CENTS + 10_000


def test_idempotency_key_reuse_with_different_payload_conflicts(seeded_client: TestClient):
    accounts = _accounts_by_name(seeded_client)
    alice, bob, carol = accounts["Alice"], accounts["Bob"], accounts["Carol"]
    key = str(uuid.uuid4())

    first = _transfer(seeded_client, alice["id"], bob["id"], 10_000, idempotency_key=key)
    conflicting = _transfer(seeded_client, alice["id"], carol["id"], 10_000, idempotency_key=key)

    assert first.status_code == 201
    assert conflicting.status_code == 409

    # The conflicting request must not have executed anything.
    updated = _accounts_by_name(seeded_client)
    assert updated["Carol"]["balance_cents"] == STARTING_BALANCE_CENTS


def test_concurrent_transfers_cannot_overdraw_account(seeded_client: TestClient):
    """Fire more concurrent transfers than the sender can afford in aggregate.

    Because every transfer moves the same amount, the number that CAN succeed
    under correct serialization is fixed (floor(balance / amount)) regardless
    of execution order -- this makes the assertion deterministic rather than
    a flaky race. If the BEGIN IMMEDIATE locking in database/session.py were
    removed, concurrent requests could both read the pre-transfer balance
    before either commits and this test would see more than 6 successes
    and/or a negative final balance.
    """
    accounts = _accounts_by_name(seeded_client)
    alice, bob = accounts["Alice"], accounts["Bob"]
    amount_cents = 15_000
    attempts = 10
    affordable = STARTING_BALANCE_CENTS // amount_cents  # 6

    results: Dict[int, int] = {}
    barrier = threading.Barrier(attempts)

    def attempt(index: int) -> None:
        barrier.wait()
        results[index] = _transfer(seeded_client, alice["id"], bob["id"], amount_cents).status_code

    threads = [threading.Thread(target=attempt, args=(i,)) for i in range(attempts)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    successes = sum(1 for status in results.values() if status == 201)
    failures = sum(1 for status in results.values() if status == 400)

    assert successes == affordable
    assert failures == attempts - affordable

    updated = _accounts_by_name(seeded_client)
    assert updated["Alice"]["balance_cents"] == STARTING_BALANCE_CENTS - affordable * amount_cents
    assert updated["Alice"]["balance_cents"] >= 0
    assert updated["Bob"]["balance_cents"] == STARTING_BALANCE_CENTS + affordable * amount_cents
