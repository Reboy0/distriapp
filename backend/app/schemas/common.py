from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, PlainSerializer


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Pydantic serializes Decimal as a JSON string by default (to avoid float
# precision surprises), but every client (TS web/mobile) treats amounts as
# `number` and calls .toFixed() on them directly. Serialize as float on the
# wire instead — precision is still exact in the DB (Numeric columns) and in
# request validation, this only affects what goes out in responses.
Money = Annotated[Decimal, PlainSerializer(lambda v: float(v), return_type=float, when_used="json")]
