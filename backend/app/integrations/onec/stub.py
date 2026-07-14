import uuid
from decimal import Decimal

from app.integrations.onec.base import (
    OneCCatalogItem,
    OneCConnector,
    OneCOrderLine,
    OneCPaymentStatus,
)


class StubOneCConnector(OneCConnector):
    """In-memory fake used for local development and tests until a real
    per-distributor connector is built (see Q1-Q3 in the functional spec)."""

    async def fetch_catalog(self) -> list[OneCCatalogItem]:
        return [
            OneCCatalogItem(
                external_code="SKU-001",
                name="Товар 1",
                unit="шт",
                base_price_with_vat=Decimal("100.00"),
                stock_qty=Decimal("50"),
            ),
            OneCCatalogItem(
                external_code="SKU-002",
                name="Товар 2",
                unit="кг",
                base_price_with_vat=Decimal("250.50"),
                stock_qty=Decimal("0"),
            ),
        ]

    async def fetch_payment_statuses(self) -> list[OneCPaymentStatus]:
        return []

    async def push_order(
        self, order_external_ref: str, point_external_ref: str, lines: list[OneCOrderLine]
    ) -> str:
        return f"1C-DOC-{uuid.uuid4().hex[:10]}"
