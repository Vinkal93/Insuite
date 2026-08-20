import { createFileRoute } from "@tanstack/react-router";
import { PublicGatePassVerificationView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/gate-pass/$passNumber")({
  head: () => ({
    meta: [
      { title: "Gate Pass Verification — InSuite" },
      { name: "description", content: "Campus security gate pass verification portal." },
    ],
  }),
  component: PublicGatePassVerificationPage,
});

function PublicGatePassVerificationPage() {
  return <PublicGatePassVerificationView />;
}
