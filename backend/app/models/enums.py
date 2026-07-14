import enum


class InvitationStatus(str, enum.Enum):
    active = "active"
    used = "used"
    expired = "expired"


class OrderStatus(str, enum.Enum):
    created = "created"
    pending_1c = "pending_1c"
    sent_to_1c = "sent_to_1c"
    cancelled = "cancelled"


class PaymentStatus(str, enum.Enum):
    none = "none"
    unpaid = "unpaid"
    paid = "paid"


class ChatSender(str, enum.Enum):
    client = "client"
    distributor = "distributor"


class SyncType(str, enum.Enum):
    catalog = "catalog"
    payments = "payments"
    manual = "manual"


class SyncStatus(str, enum.Enum):
    success = "success"
    error = "error"


class AvailabilityStatus(str, enum.Enum):
    available = "available"
    low = "low"
    out = "out"
