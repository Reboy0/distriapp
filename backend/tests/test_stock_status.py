from decimal import Decimal

from app.models.enums import AvailabilityStatus
from app.services.stock_status import compute_availability


def test_out_of_stock():
    assert compute_availability(Decimal("0"), 10) == AvailabilityStatus.out


def test_no_threshold_only_available_or_out():
    assert compute_availability(Decimal("1"), None) == AvailabilityStatus.available
    assert compute_availability(Decimal("0"), None) == AvailabilityStatus.out


def test_low_stock_within_threshold():
    assert compute_availability(Decimal("5"), 10) == AvailabilityStatus.low
    assert compute_availability(Decimal("10"), 10) == AvailabilityStatus.low


def test_available_above_threshold():
    assert compute_availability(Decimal("11"), 10) == AvailabilityStatus.available
