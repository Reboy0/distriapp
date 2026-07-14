from decimal import Decimal

from app.models.enums import AvailabilityStatus


def compute_availability(stock_qty: Decimal, low_stock_threshold: int | None) -> AvailabilityStatus:
    """CAT-5: qty=0 -> out; if no threshold set, only available/out (no "low");
    0 < qty <= threshold -> low; qty > threshold -> available. Exact qty is
    never exposed to the client."""
    if stock_qty <= 0:
        return AvailabilityStatus.out
    if low_stock_threshold is None:
        return AvailabilityStatus.available
    if stock_qty <= low_stock_threshold:
        return AvailabilityStatus.low
    return AvailabilityStatus.available
