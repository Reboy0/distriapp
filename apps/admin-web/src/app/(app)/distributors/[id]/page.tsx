"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  deactivateDistributor,
  getDistributor,
  updateDistributor,
  type DistributorInput,
} from "@/lib/api";
import { DistributorForm } from "@/components/DistributorForm";
import type { Distributor } from "@/types";

export default function EditDistributorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [distributor, setDistributor] = useState<Distributor | undefined>();
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    getDistributor(params.id).then((d) => {
      setDistributor(d);
      setLoading(false);
    });
  }, [params.id]);

  async function handleSubmit(input: DistributorInput) {
    await updateDistributor(params.id, input);
    router.push("/distributors");
  }

  async function handleDeactivate() {
    setDeactivating(true);
    try {
      await deactivateDistributor(params.id);
      router.push("/distributors");
    } finally {
      setDeactivating(false);
    }
  }

  if (loading) {
    return <p className="text-slate-400">Завантаження...</p>;
  }

  if (!distributor) {
    return (
      <div>
        <Link href="/distributors" className="text-brand-600 hover:underline">
          &larr; До списку дистриб&apos;юторів
        </Link>
        <p className="mt-4 text-slate-500">Дистриб&apos;ютора не знайдено.</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/distributors" className="mb-3 inline-block text-sm text-brand-600 hover:underline">
        &larr; До списку дистриб&apos;юторів
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">{distributor.name}</h1>
        {distributor.is_active && (
          <button
            type="button"
            className="btn-danger"
            disabled={deactivating}
            onClick={handleDeactivate}
          >
            {deactivating ? "Деактивація..." : "Деактивувати"}
          </button>
        )}
      </div>
      <DistributorForm
        initial={{
          name: distributor.name,
          contacts: distributor.contacts,
          onec_config: distributor.onec_config,
        }}
        submitLabel="Зберегти зміни"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
