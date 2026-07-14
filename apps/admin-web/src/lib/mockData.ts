import type { Distributor, SyncLog } from "@/types";

/**
 * Placeholder/mock data used as a fallback whenever the real backend
 * (http://localhost:8000/api/v1) is not reachable yet.
 */

export const mockDistributors: Distributor[] = [
  {
    id: "dist-1",
    name: "Хлібзавод №3",
    contacts: "Олена Коваль, +380501112233, olena@hlibzavod3.ua",
    onec_config: { host: "10.0.1.20", base: "Trade_2026", user: "onec_svc" },
    is_active: true,
    created_at: "2026-04-01T09:00:00Z",
  },
  {
    id: "dist-2",
    name: "Молокозавод Prostor",
    contacts: "Ігор Петренко, +380672223344, igor@prostor-milk.ua",
    onec_config: { host: "10.0.2.15", base: "UPP_Milk", user: "onec_svc" },
    is_active: true,
    created_at: "2026-05-14T09:00:00Z",
  },
  {
    id: "dist-3",
    name: "Овочева база Схід",
    contacts: "Тетяна Мельник, +380933334455, t.melnyk@vegbase.ua",
    onec_config: null,
    is_active: false,
    created_at: "2026-06-20T09:00:00Z",
  },
];

export const mockSyncLogs: SyncLog[] = [];
