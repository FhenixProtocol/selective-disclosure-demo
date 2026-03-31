import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClientSetup } from "@/components/cofhe/client-setup";
import { BalanceBar } from "@/components/cofhe/balance-bar";
import { Verifier } from "@/components/cofhe/verifier";
import { Certificate } from "@/components/cofhe/certificate";
import { useCofheStore, type ImportedAcp } from "@/stores/cofhe-store";
import { decodePermitFromHash } from "@/lib/permit-url";

export const Route = createFileRoute("/verifier")({
  component: VerifierPage,
});

function truncateAddr(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 6)}···${addr.slice(-4)}` : addr;
}

function VerifierPage() {
  const { status, addImportedAcp } = useCofheStore();
  const isConnected = status === "connected";

  const [pendingPermit, setPendingPermit] = useState<Record<string, unknown> | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [importError, setImportError] = useState<string | null>(null);

  // Parse permit from URL hash on mount
  useEffect(() => {
    const permit = decodePermitFromHash();
    if (permit) {
      setPendingPermit(permit);
    }
  }, []);

  const handleImport = () => {
    if (!pendingPermit) return;
    setImportError(null);
    setImportStatus("loading");
    try {
      // Store in zustand only — SDK import deferred to attestation time
      // via PermitUtils.importSharedAndSign so we never change the active permit
      const issuer = (pendingPermit.issuer as string) ?? "unknown";
      const name = (pendingPermit.name as string) ?? `Disclosure from ${truncateAddr(issuer)}`;
      const id = `${issuer}-${Date.now()}`;
      const recipient = (pendingPermit.recipient as string) ?? "";
      const type = (pendingPermit.type as string as ImportedAcp["type"]) ?? "recipient";
      const expiration = (pendingPermit.expiration as number) ?? 0;

      const newAcp: ImportedAcp = {
        id,
        name,
        issuer,
        recipient,
        type,
        expiration,
        raw: JSON.stringify(pendingPermit),
      };
      addImportedAcp(newAcp);

      // Import done — clear hash and go straight to the verifier view
      window.history.replaceState(null, "", "/verifier");
      setPendingPermit(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to import permit");
      setImportStatus("error");
    }
  };

  // Certificate flow — show when there's a pending permit from URL
  if (pendingPermit) {
    return (
      <Certificate
        permit={pendingPermit}
        isConnected={isConnected}
        importStatus={importStatus}
        error={importError}
        onImport={handleImport}
      />
    );
  }

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
