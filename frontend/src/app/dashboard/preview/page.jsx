import { Suspense } from "react";
import PreviewClient from "./PreviewClient";

export default function PreviewDashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PreviewClient />
    </Suspense>
  );
}
