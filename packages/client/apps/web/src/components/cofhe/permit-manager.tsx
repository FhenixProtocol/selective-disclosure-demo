import { useState } from "react";
import { PermitUtils, type Permit } from "@cofhe/sdk/permits";
import { Button } from "@client/ui/components/button";
import { Input } from "@client/ui/components/input";
import { Label } from "@client/ui/components/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@client/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@client/ui/components/dialog";
import { cofheClient } from "@/stores/cofhe-client";
import { useCofheStore } from "@/stores/cofhe-store";

type ModalMode = "self" | "sharing" | "import" | "export";

function expirationDefault(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 16);
}

export function PermitManager() {
  const { status } = useCofheStore();
  const isConnected = status === "connected";

  // Local UI state — SDK handles persistence
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("self");
  const [permitName, setPermitName] = useState("");
  const [recipient, setRecipient] = useState("");
  const [expiration, setExpiration] = useState(expirationDefault);
  const [importData, setImportData] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [exportedJson, setExportedJson] = useState<string | null>(null);

  // Read directly from SDK (refreshKey forces re-render)
  void refreshKey;
  let allPermits: Record<string, Permit> = {};
  let activePermitHash: string | null = null;
  try {
    allPermits = cofheClient.permits.getPermits() ?? {};
    activePermitHash = cofheClient.permits.getActivePermit()?.hash ?? null;
  } catch {
    /* not connected yet */
  }
  const entries = Object.entries(allPermits);

  const refresh = () => setRefreshKey((k) => k + 1);

  const openModal = (mode: ModalMode) => {
    setPermitName("");
    setRecipient("");
    setExpiration(expirationDefault());
    setImportData("");
    setModalError(null);
    setExportedJson(null);
    setModalMode(mode);
    setModalOpen(true);
  };

  const handleCreate = async () => {
    setModalError(null);
    setLoading(true);
    try {
      const exp = Math.floor(new Date(expiration).getTime() / 1000);

      const issuer = cofheClient.connection.account!;

      if (modalMode === "self") {
        await cofheClient.permits.getOrCreateSelfPermit(undefined, undefined, {
          issuer,
          name: permitName || undefined,
          expiration: exp,
        });
        refresh();
        setModalOpen(false);
      } else if (modalMode === "sharing") {
        if (!recipient) throw new Error("Recipient address is required");
        const permit = await cofheClient.permits.createSharing({
          issuer,
          recipient,
          name: permitName || `Share → ${recipient.slice(0, 8)}...`,
          expiration: exp,
        });
        refresh();
        setExportedJson(JSON.stringify(PermitUtils.export(permit), null, 2));
        setModalMode("export");
      } else if (modalMode === "import") {
        if (!importData) throw new Error("Paste the exported permit JSON");
        await cofheClient.permits.importShared(JSON.parse(importData));
        refresh();
        setModalOpen(false);
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const getName = (p: Permit | undefined) =>
    p?.name ?? "Unnamed";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>2. Permits</CardTitle>
          <CardDescription>
            Permits authorize decryption of encrypted data. The SDK persists
            them in localStorage automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activePermitHash ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">
                  Active: {getName(allPermits[activePermitHash])}
                </span>
              </div>
              <div className="rounded border bg-muted/30 p-2 font-mono text-xs break-all">
                {activePermitHash}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-yellow-500" />
              <span className="text-xs text-muted-foreground">
                No active permit
              </span>
            </div>
          )}

          {entries.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium">
                All Permits ({entries.length})
              </span>
              {entries.map(([hash, permit]) => (
                <div
                  key={hash}
                  className="flex items-center justify-between gap-2 rounded border bg-muted/20 p-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium truncate block">
                      {getName(permit)}
                      {activePermitHash === hash && (
                        <span className="ml-1.5 rounded bg-green-500/20 px-1 py-0.5 text-[10px] text-green-600 dark:text-green-400">
                          active
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground truncate block">
                      {hash}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {activePermitHash !== hash && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          cofheClient.permits.selectActivePermit(hash);
                          refresh();
                        }}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        try {
                          const exported = PermitUtils.export(permit);
                          setExportedJson(
                            JSON.stringify(exported, null, 2),
                          );
                          setModalMode("export");
                          setModalOpen(true);
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Export failed",
                          );
                        }
                      }}
                    >
                      Export
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        cofheClient.permits.removePermit(hash);
                        refresh();
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            size="sm"
            onClick={() => openModal("self")}
            disabled={!isConnected}
          >
            Create Self Permit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModal("sharing")}
            disabled={!isConnected}
          >
            Share Permit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModal("import")}
            disabled={!isConnected}
          >
            Import Permit
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "self" && "Create Self Permit"}
              {modalMode === "sharing" && "Create Sharing Permit"}
              {modalMode === "import" && "Import Shared Permit"}
              {modalMode === "export" && "Exported Permit"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "self" &&
                "Decrypt your own on-chain encrypted data."}
              {modalMode === "sharing" &&
                "Share decryption access with another address."}
              {modalMode === "export" &&
                "Share this JSON with the recipient."}
              {modalMode === "import" &&
                "Paste the permit JSON from the issuer."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {modalMode === "export" && exportedJson && (
              <div className="space-y-1.5">
                <textarea
                  readOnly
                  value={exportedJson}
                  rows={8}
                  className="w-full rounded border bg-muted/30 p-2 font-mono text-[10px] resize-none focus:outline-none"
                />
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => navigator.clipboard.writeText(exportedJson)}
                >
                  Copy to Clipboard
                </Button>
              </div>
            )}

            {(modalMode === "self" || modalMode === "sharing") && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Name (optional)</Label>
                  <Input
                    placeholder={
                      modalMode === "self"
                        ? "My self permit"
                        : "Share with Alice"
                    }
                    value={permitName}
                    onChange={(e) => setPermitName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Expiration</Label>
                  <Input
                    type="datetime-local"
                    value={expiration}
                    onChange={(e) => setExpiration(e.target.value)}
                  />
                </div>
                {modalMode === "sharing" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Recipient Address</Label>
                    <Input
                      placeholder="0x..."
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            {modalMode === "import" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Permit JSON</Label>
                <textarea
                  placeholder="Paste the exported permit JSON..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={6}
                  className="w-full rounded border bg-transparent p-2 font-mono text-xs resize-none focus:outline-none focus:border-ring"
                />
              </div>
            )}

            {modalError && (
              <div className="rounded border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
                {modalError}
              </div>
            )}
          </div>

          <DialogFooter>
            {modalMode === "export" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Done
              </Button>
            ) : (
              <Button size="sm" onClick={handleCreate} disabled={loading}>
                {loading
                  ? "Processing..."
                  : modalMode === "import"
                    ? "Import & Sign"
                    : "Create"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
