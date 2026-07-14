import type { Icon } from "@phosphor-icons/react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: Icon;
  title: string;
  description?: string;
}) {
  return (
    <div className="card animate-in flex flex-col items-center gap-2 px-6 py-10 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Icon size={24} className="text-slate-400" />
      </div>
      <p className="font-semibold text-slate-700">{title}</p>
      {description && <p className="max-w-xs text-sm text-slate-400">{description}</p>}
    </div>
  );
}
