from sqlalchemy.orm import Session

from ..models.account import Account
from ..models.ledger_entry import LedgerEntry

STARTING_BALANCE_CENTS = 100_000
SEED_ACCOUNT_NAMES = ["Alice", "Bob", "Carol", "Dave"]


def seed_database(db: Session):
    accounts = [Account(name=name) for name in SEED_ACCOUNT_NAMES]
    db.add_all(accounts)
    db.flush()  # assign account IDs before creating ledger entries

    seed_entries = [
        LedgerEntry(account_id=account.id, transfer_id=None, amount_cents=STARTING_BALANCE_CENTS)
        for account in accounts
    ]
    db.add_all(seed_entries)
    db.commit()
