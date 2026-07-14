import { Minus, Plus } from "@phosphor-icons/react/dist/ssr";

export function QuantityStepper({
  qty,
  unit,
  onChange,
  step = 1,
}: {
  qty: number;
  unit: string;
  onChange: (qty: number) => void;
  step?: number;
}) {
  const round = (n: number) => Math.round(n * 1000) / 1000;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => onChange(round(Math.max(0, qty - step)))}
          disabled={qty <= 0}
          className="flex h-9 w-9 items-center justify-center rounded-l-xl text-slate-500 transition-colors hover:bg-slate-200 disabled:opacity-30"
          aria-label="Зменшити"
        >
          <Minus size={15} weight="bold" />
        </button>
        <input
          type="number"
          min={0}
          step={step}
          inputMode="decimal"
          value={qty || ""}
          placeholder="0"
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="h-9 w-14 border-x border-slate-200 bg-transparent text-center text-sm font-semibold text-slate-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(round(qty + step))}
          className="flex h-9 w-9 items-center justify-center rounded-r-xl text-brand-600 transition-colors hover:bg-brand-50"
          aria-label="Збільшити"
        >
          <Plus size={15} weight="bold" />
        </button>
      </div>
      <span className="text-sm text-slate-400">{unit}</span>
    </div>
  );
}
