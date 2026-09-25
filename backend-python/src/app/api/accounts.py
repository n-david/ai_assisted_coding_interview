from typing import Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..database.session import get_db
from ..models.account import Account as AccountModel
from ..models.ledger_entry import LedgerEntry
from ..models.transfer import Transfer as TransferModel
from ..schemas.account import Account
from ..schemas.transfer import Transfer

router = APIRouter(prefix="/accounts", tags=["accounts"])


def _balances_by_account_id(db: Session) -> Dict[UUID, int]:
    rows = (
        db.query(LedgerEntry.account_id, func.sum(LedgerEntry.amount_cents))
        .group_by(LedgerEntry.account_id)
        .all()
    )
    return {account_id: int(total) for account_id, total in rows}


def _balance_for_account(db: Session, account_id: UUID) -> int:
    total = (
        db.query(func.coalesce(func.sum(LedgerEntry.amount_cents), 0))
        .filter(LedgerEntry.account_id == account_id)
        .scalar()
    )
    return int(total)


@router.get("/", response_model=List[Account])
def get_accounts(db: Session = Depends(get_db)):
    accounts = db.query(AccountModel).all()
    balances = _balances_by_account_id(db)
    return [
        Account(
            id=account.id,
            name=account.name,
            balance_cents=balances.get(account.id, 0),
            created_at=account.created_at,
        )
        for account in accounts
    ]


@router.get("/{account_id}", response_model=Account)
def get_account(account_id: UUID, db: Session = Depends(get_db)):
    account = db.query(AccountModel).filter(AccountModel.id == account_id).first()
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    return Account(
        id=account.id,
        name=account.name,
        balance_cents=_balance_for_account(db, account.id),
        created_at=account.created_at,
    )


@router.get("/{account_id}/transfers", response_model=List[Transfer])
def get_account_transfers(account_id: UUID, db: Session = Depends(get_db)):
    account = db.query(AccountModel).filter(AccountModel.id == account_id).first()
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found")

    return (
        db.query(TransferModel)
        .filter(
            or_(
                TransferModel.from_account_id == account_id,
                TransferModel.to_account_id == account_id,
            )
        )
        .order_by(TransferModel.created_at.desc())
        .all()
    )
