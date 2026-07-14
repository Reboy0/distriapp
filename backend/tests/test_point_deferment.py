import uuid
from datetime import date, timedelta

from app.models.point_of_sale import PointOfSale


def make_point(deferment_until=None) -> PointOfSale:
    return PointOfSale(
        id=uuid.uuid4(),
        client_id=uuid.uuid4(),
        distributor_id=uuid.uuid4(),
        name="Point",
        address="Addr",
        deferment_until=deferment_until,
    )


def test_no_deferment_is_not_active():
    point = make_point(None)
    assert point.has_active_deferment(date(2026, 8, 15)) is False


def test_deferment_active_before_and_on_date():
    until = date(2026, 8, 15)
    point = make_point(until)
    assert point.has_active_deferment(date(2026, 8, 14)) is True
    assert point.has_active_deferment(until) is True


def test_deferment_expired_after_date():
    until = date(2026, 8, 15)
    point = make_point(until)
    assert point.has_active_deferment(until + timedelta(days=1)) is False
