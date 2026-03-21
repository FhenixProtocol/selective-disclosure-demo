import { createFileRoute } from "@tanstack/react-router";
import { ClientSetup } from "@/components/cofhe/client-setup";
import { PermitManager } from "@/components/cofhe/permit-manager";
import { EncryptInput } from "@/components/cofhe/encrypt-input";
import { DecryptView } from "@/components/cofhe/decrypt-view";
import { DecryptTx } from "@/components/cofhe/decrypt-tx";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Selective Disclosure Demo</h1>
        <p className="text-xs text-muted-foreground">
          End-to-end FHE workflow: connect, permit, encrypt, and decrypt using
          the CoFHE SDK.
        </p>
      </div>
      <div className="grid gap-4">
        <ClientSetup />
        <PermitManager />
        <EncryptInput />
        <DecryptView />
        <DecryptTx />
      </div>
    </div>
  );
}
