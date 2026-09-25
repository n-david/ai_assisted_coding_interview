from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Transfer(Base):
    __tablename__ = "transfers"
    __table_args__ = (CheckConstraint("amount_cents > 0", name="ck_transfers_amount_positive"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    from_account_id: Mapped[UUID] = mapped_column(ForeignKey("accounts.id"), nullable=False)
    to_account_id: Mapped[UUID] = mapped_column(ForeignKey("accounts.id"), nullable=False)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    idempotency_key: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
