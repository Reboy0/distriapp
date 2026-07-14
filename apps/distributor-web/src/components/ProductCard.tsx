import { formatMoney, stockAvailability } from "@/lib/business";
import { StockBadge } from "@/components/Badges";
import type { Product } from "@/types";

/** Small embeddable product card, used e.g. inside chat messages ("коли буде?"). */
export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white text-lg">
        {"\u{1F369}"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{product.name}</p>
        <p className="text-xs text-slate-500">{formatMoney(product.base_price_with_vat)}</p>
      </div>
      <StockBadge availability={stockAvailability(product)} />
    </div>
  );
}
