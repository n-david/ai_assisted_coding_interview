from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class TransferCreate(BaseModel):
    from_account_id: UUID
    to_account_id: UUID
    amount_cents: int = Field(gt=0)


class Transfer(BaseModel):
    id: UUID
    from_account_id: UUID
    to_account_id: UUID
    amount_cents: int
    idempotency_key: str
    created_at: datetime

    class Config:
        from_attributes = True
