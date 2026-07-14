import type { InvitationStatus, OrderStatus, PaymentStatus, SyncStatus } from "@/types";
import type { StockAvailability } from "@/lib/business";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, string> = {
    none: "bg-slate-100 text-slate-600",
    unpaid: "bg-red-100 text-red-700",
    paid: "bg-green-100 text-green-700",
  };
  const labels: Record<PaymentStatus, string> = {
    none: "не визначено",
    unpaid: "не оплачено",
    paid: "оплачено",
  };
  return <span className={`badge ${map[status]}`}>{labels[status]}</span>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    created: "bg-slate-100 text-slate-600",
    pending_1c: "bg-amber-100 text-amber-700",
    sent_to_1c: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const labels: Record<OrderStatus, string> = {
    created: "створено",
    pending_1c: "очікує 1С",
    sent_to_1c: "надіслано в 1С",
    cancelled: "скасовано",
  };
  return <span className={`badge ${map[status]}`}>{labels[status]}</span>;
}

export function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  const map: Record<InvitationStatus, string> = {
    active: "bg-green-100 text-green-700",
    used: "bg-slate-100 text-slate-600",
    expired: "bg-red-100 text-red-700",
  };
  const labels: Record<InvitationStatus, string> = {
    active: "активне",
    used: "використано",
    expired: "прострочено",
  };
  return <span className={`badge ${map[status]}`}>{labels[status]}</span>;
}

export function StockBadge({ availability }: { availability: StockAvailability }) {
  const map: Record<StockAvailability, string> = {
    none: "bg-red-100 text-red-700",
    low: "bg-amber-100 text-amber-700",
    available: "bg-green-100 text-green-700",
  };
  const labels: Record<StockAvailability, string> = {
    none: "немає",
    low: "закінчується",
    available: "є",
  };
  return <span className={`badge ${map[availability]}`}>{labels[availability]}</span>;
}

export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const map: Record<SyncStatus, string> = {
    success: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
  };
  const labels: Record<SyncStatus, string> = {
    success: "успішно",
    error: "помилка",
  };
  return <span className={`badge ${map[status]}`}>{labels[status]}</span>;
}
