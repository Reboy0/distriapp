import {
  CheckCircle,
  Sparkle,
  WarningCircle,
  XCircle,
  Prohibit,
  CircleDashed,
} from "@phosphor-icons/react/dist/ssr";
import type { AvailabilityStatus, OrderStatus, PaymentStatus } from "@/types";

export function StockBadge({ availability }: { availability: AvailabilityStatus }) {
  const map: Record<AvailabilityStatus, string> = {
    out: "bg-danger-50 text-danger-700",
    low: "bg-warning-50 text-warning-700",
    available: "bg-success-50 text-success-700",
  };
  const labels: Record<AvailabilityStatus, string> = {
    out: "немає",
    low: "закінчується",
    available: "є",
  };
  const icons: Record<AvailabilityStatus, React.ReactNode> = {
    out: <XCircle size={13} weight="fill" />,
    low: <WarningCircle size={13} weight="fill" />,
    available: <CheckCircle size={13} weight="fill" />,
  };
  return (
    <span className={`badge ${map[availability]}`}>
      {icons[availability]}
      {labels[availability]}
    </span>
  );
}

export function NewBadge() {
  return (
    <span className="badge bg-brand-50 text-brand-700">
      <Sparkle size={13} weight="fill" />
      новинка
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    created: "bg-slate-100 text-slate-600",
    pending_1c: "bg-slate-100 text-slate-600",
    sent_to_1c: "bg-slate-100 text-slate-600",
    cancelled: "bg-danger-50 text-danger-700",
  };
  const labels: Record<OrderStatus, string> = {
    created: "створено",
    pending_1c: "створено",
    sent_to_1c: "створено",
    cancelled: "скасовано",
  };
  const icons: Record<OrderStatus, React.ReactNode> = {
    created: <CircleDashed size={13} weight="bold" />,
    pending_1c: <CircleDashed size={13} weight="bold" />,
    sent_to_1c: <CircleDashed size={13} weight="bold" />,
    cancelled: <Prohibit size={13} weight="fill" />,
  };
  return (
    <span className={`badge ${map[status]}`}>
      {icons[status]}
      {labels[status]}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, string> = {
    none: "bg-slate-100 text-slate-600",
    unpaid: "bg-danger-50 text-danger-700",
    paid: "bg-success-50 text-success-700",
  };
  const labels: Record<PaymentStatus, string> = {
    none: "не оплачено",
    unpaid: "не оплачено",
    paid: "оплачено",
  };
  const icons: Record<PaymentStatus, React.ReactNode> = {
    none: <CircleDashed size={13} weight="bold" />,
    unpaid: <WarningCircle size={13} weight="fill" />,
    paid: <CheckCircle size={13} weight="fill" />,
  };
  return (
    <span className={`badge ${map[status]}`}>
      {icons[status]}
      {labels[status]}
    </span>
  );
}
