import {
  CheckCircle,
  Clock,
  Sparkle,
  WarningCircle,
  XCircle,
  PaperPlaneTilt,
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
    pending_1c: "bg-warning-50 text-warning-700",
    sent_to_1c: "bg-brand-50 text-brand-700",
    cancelled: "bg-danger-50 text-danger-700",
  };
  const labels: Record<OrderStatus, string> = {
    created: "створено",
    pending_1c: "очікує 1С",
    sent_to_1c: "надіслано в 1С",
    cancelled: "скасовано",
  };
  const icons: Record<OrderStatus, React.ReactNode> = {
    created: <CircleDashed size={13} weight="bold" />,
    pending_1c: <Clock size={13} weight="fill" />,
    sent_to_1c: <PaperPlaneTilt size={13} weight="fill" />,
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
    none: "не визначено",
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
