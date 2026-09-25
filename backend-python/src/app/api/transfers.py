from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database.session import get_db
from ..models.account import Account
from ..models.ledger_entry import LedgerEntry
from ..models.transfer import Transfer as TransferModel
from ..schemas.transfer import Transfer, TransferCreate

router = APIRouter(prefix="/transfers", tags=["transfers"])


def _balance_for_account(db: Session, account_id: UUID) -> int:
    total = (
        db.query(func.coalesce(func.sum(LedgerEntry.amount_cents), 0))
        .filter(LedgerEntry.account_id == account_id)
        .scalar()
    )
    return int(total)


def _matches_payload(transfer: TransferModel, payload: TransferCreate) -> bool:
    return (
        transfer.from_account_id == payload.from_account_id
        and transfer.to_account_id == payload.to_account_id
        and transfer.amount_cents == payload.amount_cents
    )


@router.post("/", response_model=Transfer)
def create_transfer(
    payload: TransferCreate,
    response: Response,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    db: Session = Depends(get_db),
):
    if payload.from_account_id == payload.to_account_id:
        raise HTTPException(status_code=400, detail="Cannot transfer an account to itself")

    existing = (
        db.query(TransferModel).filter(TransferModel.idempotency_key == idempotency_key).first()
    )
    if existing is not None:
        if not _matches_payload(existing, payload):
            raise HTTPException(
                status_code=409,
                detail="Idempotency-Key was already used with a different request",
            )
        return existing

    from_account = db.query(Account).filter(Account.id == payload.from_account_id).first()
    if from_account is None:
        raise HTTPException(status_code=404, detail="from_account_id not found")
    to_account = db.query(Account).filter(Account.id == payload.to_account_id).first()
    if to_account is None:
        raise HTTPException(status_code=404, detail="to_account_id not found")

    balance = _balance_for_account(db, payload.from_account_id)
    if balance < payload.amount_cents:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    transfer = TransferModel(
        from_account_id=payload.from_account_id,
        to_account_id=payload.to_account_id,
        amount_cents=payload.amount_cents,
        idempotency_key=idempotency_key,
    )
    db.add(transfer)
    db.flush()  # assign transfer.id before creating the linked ledger entries

    db.add_all(
        [
            LedgerEntry(
                account_id=payload.from_account_id,
                transfer_id=transfer.id,
                amount_cents=-payload.amount_cents,
            ),
            LedgerEntry(
                account_id=payload.to_account_id,
                transfer_id=transfer.id,
                amount_cents=payload.amount_cents,
            ),
        ]
    )

    try:
        db.commit()
    except IntegrityError:
        # Another request committed the same Idempotency-Key first; the whole
        # transaction (transfer + both ledger entries) rolled back atomically,
        # so there's nothing partial to clean up. Replay its result instead.
        db.rollback()
        replay = (
            db.query(TransferModel).filter(TransferModel.idempotency_key == idempotency_key).first()
        )
        if replay is None:
            raise
        return replay

    db.refresh(transfer)
    response.status_code = 201
    return transfer
