import uuid

from pydantic import BaseModel

from app.schemas.common import ORMModel


class DistributorCreate(BaseModel):
    name: str
    contacts: str | None = None
    onec_config: dict | None = None
    login_email: str
    login_password: str


class DistributorUpdate(BaseModel):
    name: str | None = None
    contacts: str | None = None
    onec_config: dict | None = None
    is_active: bool | None = None


class DistributorOut(ORMModel):
    id: uuid.UUID
    name: str
    contacts: str | None
    is_active: bool
