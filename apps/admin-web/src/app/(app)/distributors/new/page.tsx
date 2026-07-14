"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createDistributor, type DistributorInput } from "@/lib/api";
import { DistributorForm } from "@/components/DistributorForm";

export default function NewDistributorPage() {
  const router = useRouter();

  async function handleSubmit(input: DistributorInput) {
    await createDistributor(input);
    router.push("/distributors");
  }

  return (
    <div>
      <Link href="/distributors" className="mb-3 inline-block text-sm text-brand-600 hover:underline">
        &larr; До списку дистриб&apos;юторів
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Новий дистриб&apos;ютор</h1>
      <DistributorForm submitLabel="Створити" onSubmit={handleSubmit} />
    </div>
  );
}
