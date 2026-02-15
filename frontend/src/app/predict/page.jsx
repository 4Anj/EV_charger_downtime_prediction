"use client";

import { useRouter } from "next/navigation";
import PredictForm from "@/components/Prediction";

export default function PredictPage() {
  const router = useRouter();

  function handleResult(result) {
    localStorage.setItem("last_prediction", JSON.stringify(result));
    router.push("/dashboard");
  }

  return (
    <main className="p-6 max-w-xl mx-auto">
      <PredictForm onResult={handleResult} />
    </main>
  );
}
