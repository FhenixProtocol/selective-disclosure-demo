import { createFileRoute } from "@tanstack/react-router";
import { ClientSetup } from "@/components/cofhe/client-setup";
import { BalanceBar } from "@/components/cofhe/balance-bar";
import { Mint } from "@/components/cofhe/mint";
import { SelfPermits, SelectiveDisclosure } from "@/components/cofhe/token-holder";
import { useCofheStore } from "@/stores/cofhe-store";

export const Route = createFileRoute("/holder")({
  component: HolderPage,
});

function HolderPage() {
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

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Left column: mint + self permits */}
        <div className="flex flex-col gap-4">
          <Mint />
          <SelfPermits />
        </div>

        {/* Right column: selective disclosure */}
        <SelectiveDisclosure />
      </div>
    </>
  );
}
