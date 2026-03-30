import { createFileRoute } from "@tanstack/react-router";
import { ClientSetup } from "@/components/cofhe/client-setup";
import { BalanceBar } from "@/components/cofhe/balance-bar";
import { Verifier } from "@/components/cofhe/verifier";
import { useCofheStore } from "@/stores/cofhe-store";

export const Route = createFileRoute("/verifier")({
  component: VerifierPage,
});

function VerifierPage() {
  const { status } = useCofheStore();
  const isConnected = status === "connected";

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto">
        <ClientSetup />
      </div>
    );
  }

  return (
    <>
      {/* Top bars: wallet + balance — side by side on lg+ */}
      <div className="grid gap-4 mb-6 lg:grid-cols-2">
        <ClientSetup />
        <BalanceBar />
      </div>

      <div className="max-w-xl mx-auto">
        <Verifier />
      </div>
    </>
  );
}
