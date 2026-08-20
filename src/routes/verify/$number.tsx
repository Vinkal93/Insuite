import { createFileRoute } from "@tanstack/react-router";
import { PublicVerificationView } from "@/features/documents";

export const Route = createFileRoute("/verify/$number")({
  head: () => ({
    meta: [
      { title: "Public Document Verification — InSuite" },
      { name: "description", content: "Official verification of institutional certificate and ID credentials." },
    ],
  }),
  component: PublicVerificationPage,
});

function PublicVerificationPage() {
  return <PublicVerificationView />;
}
