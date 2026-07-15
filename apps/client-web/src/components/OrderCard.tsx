import Link from "next/link";
import { CaretRight, CreditCard, XCircle } from "@phosphor-icons/react/dist/ssr";
import { formatDate, formatMoney } from "@/lib/business";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/Badges";
import type { Order } from "@/types";

export function OrderCard({ order }: { order: Order }) {
  const total = order.items.reduce((s, i) => s + i.sum, 0);

  return (
    <div className="card animate-in p-4">
      <Link href={`/orders/${order.id}`} className="block">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">{formatDate(order.created_at)}</p>
          <div className="flex flex-wrap justify-end gap-1.5">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>
        </div>
        <ul className="space-y-1.5 text-sm text-slate-600">
          {order.items.map((line, idx) => (
            <li key={idx} className="flex justify-between gap-3 tabular-nums">
              <span className="truncate text-slate-600">
                {line.product_name} <span className="text-slate-400">× {line.qty}</span>
              </span>
              <span className="shrink-0 font-medium text-slate-700">{formatMoney(line.sum)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1 text-sm font-medium text-slate-500">
            Разом
            <CaretRight size={14} className="text-slate-300" />
          </span>
          <span className="text-base font-bold tabular-nums text-slate-900">
            {formatMoney(total)}
          </span>
        </div>
      </Link>
      {order.status === "cancelled" && order.cancel_comment && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-danger-50 p-3 text-xs text-danger-700">
          <XCircle size={16} weight="fill" className="mt-0.5 shrink-0" />
          <span>Скасовано: {order.cancel_comment}</span>
        </div>
      )}
      {order.payment_status === "unpaid" && order.payment_url && (
        <a
          href={order.payment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-3 w-full"
        >
          <CreditCard size={18} weight="bold" />
          Оплатити
        </a>
      )}
    </div>
  );
}
