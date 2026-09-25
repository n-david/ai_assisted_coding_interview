from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class Account(BaseModel):
    id: UUID
    name: str
    balance_cents: int
    created_at: datetime

    class Config:
        from_attributes = True
