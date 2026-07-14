from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal


@dataclass
class OneCCatalogItem:
    external_code: str
    name: str
    unit: str
    base_price_with_vat: Decimal
    stock_qty: Decimal


@dataclass
class OneCPaymentStatus:
    onec_document_id: str
    is_paid: bool


@dataclass
class OneCOrderLine:
    external_code: str
    qty: Decimal
    unit_price_with_vat: Decimal


class OneCConnector(ABC):
    """Abstract exchange interface with a distributor's 1C instance.

    Q1-Q3 in the spec (1C config/version, entity-mapping keys, and which
    document/state marks an order "unpaid") are not yet answered by the
    customer, so concrete connectors (COM, HTTP services, file exchange)
    are deferred. Business logic is built against this interface only —
    see StubOneCConnector for the dev/test implementation.
    """

    @abstractmethod
    async def fetch_catalog(self) -> list[OneCCatalogItem]:
        """Daily import: nomenclature, stock, base prices (INT-2)."""

    @abstractmethod
    async def fetch_payment_statuses(self) -> list[OneCPaymentStatus]:
        """3x/day import: which delivered orders are unpaid (INT-3)."""

    @abstractmethod
    async def push_order(
        self, order_external_ref: str, point_external_ref: str, lines: list[OneCOrderLine]
    ) -> str:
        """Create an un-posted (unproved) document in 1C immediately after
        checkout (INT-4). Returns the 1C document id. Never posts/proves it,
        and cancellation is never pushed back — the 1C operator removes it
        by hand (ORD-11)."""
