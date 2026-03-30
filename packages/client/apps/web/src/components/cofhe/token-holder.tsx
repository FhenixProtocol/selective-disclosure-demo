import { useState } from "react";
import { PermitUtils, type Permit } from "@cofhe/sdk/permits";
import { Shield, KeyRound, Share2, Trash2, Check as CheckIcon, ShieldAlert, Eye } from "lucide-react";
import { Button } from "@client/ui/components/button";
import { Input } from "@client/ui/components/input";
import { Label } from "@client/ui/components/label";
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

function expirationDefault(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 16);
}

function formatExpiration(exp: number) {
  if (!exp || exp === 0) return "No expiration";
  const date = new Date(exp * 1000);
  const expired = date < new Date();
  const formatted = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
  return expired ? `Expired ${formatted}` : formatted;
}

function isExpired(exp: number) {
  if (!exp || exp === 0) return false;
  return new Date(exp * 1000) < new Date();
}

function getName(p: Permit | undefined) {
  return p?.name ?? "Unnamed";
}

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

// ---------------------------------------------------------------------------
// Self Permits — left column
// ---------------------------------------------------------------------------

export function SelfPermits() {
  const { status, bumpPermitVersion } = useCofheStore();

  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [permitName, setPermitName] = useState("");
  const [expiration, setExpiration] = useState(expirationDefault);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const isConnected = status === "connected";

  void refreshKey;
  let allPermits: Record<string, Permit> = {};
  let activePermitHash: string | null = null;
  try {
    allPermits = cofheClient.permits.getPermits() ?? {};
    activePermitHash = cofheClient.permits.getActivePermit()?.hash ?? null;
  } catch {
    /* not connected */
  }

  const selfEntries = Object.entries(allPermits).filter(([, p]) => p.type === "self");

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    bumpPermitVersion();
  };

  const openModal = () => {
    setPermitName("");
    setExpiration(expirationDefault());
    setModalError(null);
    setModalOpen(true);
  };

  const handleCreate = async () => {
    setModalError(null);
    setModalLoading(true);
    try {
      const exp = Math.floor(new Date(expiration).getTime() / 1000);
      const issuer = cofheClient.connection.account!;
      await cofheClient.permits.getOrCreateSelfPermit(undefined, undefined, {
        issuer,
        name: permitName || undefined,
        expiration: exp,
      });
      refresh();
      setModalOpen(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border/30 bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 dark:bg-accent/10">
            <KeyRound className="size-4 text-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Self Permits</p>
            <p className="text-xs text-muted-foreground">
              Decrypt your own on-chain encrypted data
            </p>
          </div>
        </div>

        {/* Active permit status */}
        {activePermitHash && allPermits[activePermitHash]?.type === "self" ? (
          <div className="rounded-lg border border-accent/30 bg-accent/8 dark:bg-accent/5 px-3 py-2">
            <div className="flex items-center gap-2">
              <CheckIcon className="size-3.5 text-accent" />
              <span className="text-xs font-medium text-foreground">
                Active: {getName(allPermits[activePermitHash])}
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground break-all">
              {activePermitHash}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border/20 bg-secondary px-3 py-2">
            <span className="text-xs text-muted-foreground">
              No active self permit
            </span>
          </div>
        )}

        {/* Self permit list */}
        {selfEntries.length > 0 ? (
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              All Self Permits ({selfEntries.length})
            </p>
            {selfEntries.map(([hash, permit]) => (
              <div
                key={hash}
                className={`rounded-lg border px-3 py-2.5 ${
                  isExpired(permit.expiration)
                    ? "border-destructive/20 bg-destructive/5"
                    : "border-border/20 bg-secondary"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-foreground truncate">
                        {getName(permit)}
                      </span>
                      {activePermitHash === hash ? (
                        <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground dark:text-accent">
                          active
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      <span className={isExpired(permit.expiration) ? "text-destructive" : ""}>
                        Exp: {formatExpiration(permit.expiration)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    {activePermitHash !== hash ? (
                      <button
                        onClick={() => {
                          cofheClient.permits.selectActivePermit(hash);
                          refresh();
                        }}
                        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-[color,background-color] hover:bg-foreground/5 hover:text-foreground"
                        aria-label="Activate permit"
                      >
                        <Shield className="size-3.5" />
                      </button>
                    ) : null}
                    <button
                      onClick={() => {
                        cofheClient.permits.removePermit(hash);
                        refresh();
                      }}
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-[color,background-color] hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove permit"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <Button
          variant="fhenix-cta"
          size="sm"
          onClick={openModal}
          disabled={!isConnected}
        >
          Create Self Permit
        </Button>
      </div>

      {/* Create Self Permit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md rounded-xl border-border/30 bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Create Self Permit
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Decrypt your own on-chain encrypted data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Name (optional)
              </Label>
              <Input
                placeholder="My self permit"
                value={permitName}
                onChange={(e) => setPermitName(e.target.value)}
                className="h-9 rounded-lg border-border/30 bg-secondary px-3 text-sm text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Expiration
              </Label>
              <Input
                type="datetime-local"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                className="h-9 rounded-lg border-border/30 bg-secondary px-3 text-sm text-foreground"
              />
            </div>
            {modalError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {modalError}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="fhenix-cta"
              size="sm"
              onClick={handleCreate}
              disabled={modalLoading}
            >
              {modalLoading ? "Processing…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Selective Disclosure — right column
// ---------------------------------------------------------------------------

export function SelectiveDisclosure() {
  const { status, bumpPermitVersion } = useCofheStore();

  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"sharing" | "export">("sharing");
  const [permitName, setPermitName] = useState("");
  const [recipient, setRecipient] = useState("");
  const [expiration, setExpiration] = useState(expirationDefault);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [exportedJson, setExportedJson] = useState<string | null>(null);

  const isConnected = status === "connected";

  void refreshKey;
  let allPermits: Record<string, Permit> = {};
  try {
    allPermits = cofheClient.permits.getPermits() ?? {};
  } catch {
    /* not connected */
  }

  const sharedEntries = Object.entries(allPermits).filter(([, p]) => p.type === "sharing");

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    bumpPermitVersion();
  };

  const openModal = () => {
    setPermitName("");
    setRecipient("");
    setExpiration(expirationDefault());
    setModalError(null);
    setExportedJson(null);
    setModalMode("sharing");
    setModalOpen(true);
  };

  const handleCreate = async () => {
    setModalError(null);
    setModalLoading(true);
    try {
      if (!recipient) throw new Error("Verifier address is required");
      const exp = Math.floor(new Date(expiration).getTime() / 1000);
      const issuer = cofheClient.connection.account!;
      const permit = await cofheClient.permits.createSharing({
        issuer,
        recipient,
        name: permitName || undefined,
        expiration: exp,
      });
      refresh();
      setExportedJson(JSON.stringify(PermitUtils.export(permit), null, 2));
      setModalMode("export");
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-xl border border-border/30 bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 dark:bg-accent/10">
              <Eye className="size-4 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Selective Disclosure
              </p>
              <p className="text-xs text-muted-foreground">
                Grant a compliance verifier permission to attest your confidential balance
              </p>
            </div>
          </div>

          {/* Disclosure permits list */}
          {sharedEntries.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Disclosure Permits ({sharedEntries.length})
              </p>
              {sharedEntries.map(([hash, permit]) => (
                <div
                  key={hash}
                  className={`rounded-lg border px-3 py-2.5 ${
                    isExpired(permit.expiration)
                      ? "border-destructive/20 bg-destructive/5"
                      : "border-border/20 bg-secondary"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {permit.name ? (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-medium text-foreground truncate">
                            {permit.name}
                          </span>
                        </div>
                      ) : null}
                      {permit.recipient !== ZERO_ADDR ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground shrink-0">Verifier</span>
                          <span className="font-mono text-[10px] text-foreground break-all">
                            {permit.recipient}
                          </span>
                        </div>
                      ) : null}
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        <span className={isExpired(permit.expiration) ? "text-destructive" : ""}>
                          Expires: {formatExpiration(permit.expiration)}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <button
                        onClick={() => {
                          try {
                            const exported = PermitUtils.export(permit);
                            setExportedJson(JSON.stringify(exported, null, 2));
                            setModalMode("export");
                            setModalOpen(true);
                          } catch (err) {
                            setError(
                              err instanceof Error ? err.message : "Export failed",
                            );
                          }
                        }}
                        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-[color,background-color] hover:bg-foreground/5 hover:text-foreground"
                        aria-label="Export disclosure permit"
                      >
                        <Share2 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          cofheClient.permits.removePermit(hash);
                          refresh();
                        }}
                        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-[color,background-color] hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Remove disclosure permit"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border/20 bg-secondary px-3 py-2">
              <span className="text-xs text-muted-foreground">
                No disclosure permits yet — grant one to a compliance verifier
              </span>
            </div>
          )}

          <Button
            variant="fhenix-cta"
            size="sm"
            onClick={openModal}
            disabled={!isConnected}
          >
            Grant Disclosure
          </Button>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-destructive">
                Operation Failed
              </p>
              <p className="mt-0.5 text-xs text-destructive/80">{error}</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Grant Disclosure Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md rounded-xl border-border/30 bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              {modalMode === "sharing" ? "Grant Disclosure" : "Disclosure Permit Created"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {modalMode === "sharing"
                ? "Create a disclosure permit so a compliance verifier can attest your confidential balance."
                : "Copy this permit and send it to the compliance verifier."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {modalMode === "export" && exportedJson ? (
              <div className="space-y-2">
                <textarea
                  readOnly
                  value={exportedJson}
                  rows={8}
                  className="w-full rounded-lg border border-border/30 bg-secondary p-3 font-mono text-[10px] text-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  variant="fhenix"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(exportedJson)}
                >
                  Copy to Clipboard
                </Button>
              </div>
            ) : null}

            {modalMode === "sharing" ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Name (optional)
                  </Label>
                  <Input
                    placeholder="Disclosure for Alice"
                    value={permitName}
                    onChange={(e) => setPermitName(e.target.value)}
                    className="h-9 rounded-lg border-border/30 bg-secondary px-3 text-sm text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Expiration
                  </Label>
                  <Input
                    type="datetime-local"
                    value={expiration}
                    onChange={(e) => setExpiration(e.target.value)}
                    className="h-9 rounded-lg border-border/30 bg-secondary px-3 text-sm text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Verifier Address
                  </Label>
                  <Input
                    name="recipient-address"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="0x…"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="h-9 rounded-lg border-border/30 bg-secondary px-3 text-sm text-foreground"
                  />
                </div>
              </>
            ) : null}

            {modalError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {modalError}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            {modalMode === "export" ? (
              <Button
                variant="fhenix"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Done
              </Button>
            ) : (
              <Button
                variant="fhenix-cta"
                size="sm"
                onClick={handleCreate}
                disabled={modalLoading}
              >
                {modalLoading ? "Processing…" : "Grant Disclosure"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
