from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    __table_args__ = (
        CheckConstraint("amount_cents != 0", name="ck_ledger_entries_amount_nonzero"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    account_id: Mapped[UUID] = mapped_column(ForeignKey("accounts.id"), nullable=False, index=True)
    transfer_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("transfers.id"), nullable=True)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
