import { useState } from "react";
import { FheTypes } from "@cofhe/sdk";
import { FileKey, Search, Check, Trash2, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@client/ui/components/button";
import { Label } from "@client/ui/components/label";
import { cofheClient } from "@/stores/cofhe-client";
import { useCofheStore, type ImportedAcp } from "@/stores/cofhe-store";
import { MOCK_ERC7984_TOKEN } from "@/contracts/MockERC7984Token";
import { parsePermitError } from "@/lib/parse-permit-error";

interface VerifiedResult {
  holder: string;
  balance: string;
  permitHash: string;
  verifiedAt: string;
}

function truncateAddr(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}···${addr.slice(-4)}` : addr;
}

function getTypeLabel(type: string) {
  if (type === "self") return "Self";
  if (type === "sharing") return "Shared";
  if (type === "recipient") return "Received";
  return type;
}

function formatExpiration(exp: number) {
  if (!exp || exp === 0) return "No expiration";
  const date = new Date(exp * 1000);
  const formatted = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
  return date < new Date() ? `Expired ${formatted}` : formatted;
}

function isExpired(exp: number) {
  if (!exp || exp === 0) return false;
  return new Date(exp * 1000) < new Date();
}

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

export function Verifier() {
  const {
    status,
    bumpPermitVersion,
    importedAcps,
    selectedAcpId,
    addImportedAcp,
    removeImportedAcp,
    setSelectedAcpId,
  } = useCofheStore();

  const [acpJson, setAcpJson] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifiedResult | null>(null);

  const isConnected = status === "connected";
  const selectedAcp = importedAcps.find((a) => a.id === selectedAcpId);

  const handleImportAcp = async () => {
    setError(null);
    setLoading("import");
    try {
      if (!acpJson.trim()) throw new Error("Paste the ACP JSON");
      let parsed = JSON.parse(acpJson);
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }

      await cofheClient.permits.importShared(parsed);
      bumpPermitVersion();

      const issuer = parsed.issuer ?? "unknown";
      const name = parsed.name ?? `ACP from ${truncateAddr(issuer)}`;
      const id = `${issuer}-${Date.now()}`;
      const recipient = parsed.recipient ?? "";
      const type = parsed.type ?? "recipient";
      const expiration = parsed.expiration ?? 0;

      const newAcp: ImportedAcp = { id, name, issuer, recipient, type, expiration, raw: JSON.stringify(parsed) };
      addImportedAcp(newAcp);
      setAcpJson("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import ACP");
    } finally {
      setLoading(null);
    }
  };

  const handleRemoveAcp = (id: string) => {
    removeImportedAcp(id);
    if (selectedAcpId === id) {
      setResult(null);
    }
  };

  const handleSelectAcp = async (acp: ImportedAcp) => {
    setSelectedAcpId(acp.id);
    setResult(null);
    setError(null);

    try {
      let parsed = JSON.parse(acp.raw);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      await cofheClient.permits.importShared(parsed);
      bumpPermitVersion();
    } catch {
      // Already imported, just selecting
    }
  };

  const handleVerify = async () => {
    if (!selectedAcp) return;
    setError(null);
    setResult(null);
    setLoading("verify");
    try {
      const publicClient = cofheClient.connection.publicClient;
      if (!publicClient) throw new Error("Not connected");

      const ctHash = await publicClient.readContract({
        address: MOCK_ERC7984_TOKEN.address,
        abi: MOCK_ERC7984_TOKEN.abi,
        functionName: "confidentialBalanceOf",
        args: [selectedAcp.issuer as `0x${string}`],
      });

      const plaintext = await cofheClient
        .decryptForView(ctHash as string, FheTypes.Uint64)
        .execute();

      const raw = BigInt(String(plaintext));
      const formatted = (Number(raw) / 1e6).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      });

      const activePermit = cofheClient.permits.getActivePermit();

      setResult({
        holder: selectedAcp.issuer,
        balance: formatted,
        permitHash: activePermit?.hash ?? "unknown",
        verifiedAt:
          new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "UTC",
          }).format(new Date()) + " UTC",
      });
    } catch (err) {
      setError(parsePermitError(err));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Import ACP */}
      <div className="rounded-xl border border-border/30 bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 dark:bg-accent/10">
            <FileKey className="size-4 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Import ACPs
            </p>
            <p className="text-xs text-muted-foreground">
              Paste Access Control Permits received from token holders
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            ACP JSON
          </Label>
          <textarea
            placeholder="Paste an ACP JSON here…"
            value={acpJson}
            onChange={(e) => setAcpJson(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border/30 bg-secondary p-3 font-mono text-xs text-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <Button
          variant="fhenix-cta"
          size="sm"
          onClick={handleImportAcp}
          disabled={!isConnected || !acpJson.trim() || loading === "import"}
        >
          {loading === "import" ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Importing…
            </>
          ) : (
            "Import ACP"
          )}
        </Button>

        {/* Imported ACPs list */}
        {importedAcps.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Imported ({importedAcps.length})
            </p>
            {importedAcps.map((rawAcp) => {
              // Backfill fields for ACPs stored before the schema was extended
              let acp = rawAcp;
              if (!acp.expiration && acp.raw) {
                try {
                  const p = JSON.parse(acp.raw);
                  acp = {
                    ...acp,
                    expiration: p.expiration ?? 0,
                    recipient: acp.recipient || p.recipient || "",
                    type: acp.type || p.type || "recipient",
                  };
                } catch { /* ignore */ }
              }
              return (
              <button
                key={acp.id}
                onClick={() => handleSelectAcp(acp)}
                className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-[color,background-color,border-color] ${
                  isExpired(acp.expiration)
                    ? "border-destructive/20 bg-destructive/5"
                    : selectedAcpId === acp.id
                      ? "border-accent/30 bg-accent/8 dark:bg-accent/5"
                      : "border-border/20 bg-secondary hover:bg-secondary/80"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground truncate">
                      {acp.name}
                    </span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      acp.type === "self"
                        ? "bg-accent/15 text-foreground"
                        : "bg-primary/10 text-foreground"
                    }`}>
                      {getTypeLabel(acp.type)}
                    </span>
                    {selectedAcpId === acp.id ? (
                      <Check className="size-3 text-accent" />
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                    <span className="font-mono">
                      Issuer: {truncateAddr(acp.issuer)}
                    </span>
                    {acp.recipient && acp.recipient !== ZERO_ADDR ? (
                      <span className="font-mono">
                        Recipient: {truncateAddr(acp.recipient)}
                      </span>
                    ) : null}
                    <span className={isExpired(acp.expiration) ? "text-destructive" : ""}>
                      Exp: {formatExpiration(acp.expiration)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveAcp(acp.id);
                  }}
                  className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-[color,background-color] hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove ACP"
                >
                  <Trash2 className="size-3" />
                </button>
              </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Verify Balance */}
      {selectedAcp ? (
        <div className="rounded-xl border border-border/30 bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 dark:bg-accent/10">
              <Search className="size-4 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                Verify Balance
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Using ACP from{" "}
                <span className="font-mono">{truncateAddr(selectedAcp.issuer)}</span>
              </p>
            </div>
            <Button
              variant="fhenix-cta"
              size="sm"
              onClick={handleVerify}
              disabled={loading === "verify"}
            >
              {loading === "verify" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify Balance"
              )}
            </Button>
          </div>

          {result ? (
            <div className="rounded-lg border border-accent/30 bg-accent/8 dark:bg-accent/5 p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Verified Encrypted Balance
              </p>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs">
                <span className="text-muted-foreground">Holder</span>
                <span className="text-foreground break-all">
                  {result.holder}
                </span>
                <span className="text-muted-foreground">Asset</span>
                <span className="text-foreground">cUSD</span>
                <span className="text-muted-foreground">Balance</span>
                <span className="text-foreground font-semibold">
                  {result.balance} cUSD
                </span>
                <span className="text-muted-foreground">Permit</span>
                <span className="text-foreground break-all">
                  {result.permitHash}
                </span>
                <span className="text-muted-foreground">Verified</span>
                <span className="text-foreground">{result.verifiedAt}</span>
              </div>
            </div>
          ) : null}
        </div>
      ) : importedAcps.length > 0 ? (
        <div className="rounded-lg border border-border/20 bg-secondary px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            Select an ACP above to verify a holder's balance
          </p>
        </div>
      ) : null}

      {/* Error display */}
      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-destructive">
              Verification Failed
            </p>
            <p className="mt-0.5 text-xs text-destructive/80">
              {error}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
