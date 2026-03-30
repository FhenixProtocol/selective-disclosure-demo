import { useState, useEffect, useRef } from "react";
import { FheTypes } from "@cofhe/sdk";
import { Eye, Lock, Loader2 } from "lucide-react";
import { parsePermitError } from "@/lib/parse-permit-error";
import { Button } from "@client/ui/components/button";
import { cofheClient } from "@/stores/cofhe-client";
import { useCofheStore } from "@/stores/cofhe-store";

export function BalanceBar() {
  const {
    account,
    balanceCtHash,
    decryptedBalance,
    setDecryptedBalance,
    permitVersion,
  } = useCofheStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When permit changes, clear decrypted value so user must re-decrypt
  const prevPermitVersion = useRef(permitVersion);
  useEffect(() => {
    if (permitVersion !== prevPermitVersion.current) {
      prevPermitVersion.current = permitVersion;
      setDecryptedBalance(null);
    }
  }, [permitVersion, setDecryptedBalance]);

  // Check if there's a valid self-permit for the connected account
  let hasValidPermit = false;
  try {
    const active = cofheClient.permits.getActivePermit();
    if (active && account) {
      hasValidPermit =
        active.issuer.toLowerCase() === account.toLowerCase();
    }
  } catch {
    /* not connected */
  }

  const handleDecrypt = async () => {
    if (!balanceCtHash) return;
    setError(null);
    setLoading(true);
    try {
      const plaintext = await cofheClient
        .decryptForView(balanceCtHash, FheTypes.Uint64)
        .execute();

      const raw = BigInt(String(plaintext));
      const formatted = (Number(raw) / 1e6).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      });
      setDecryptedBalance(formatted);
    } catch (err) {
      setError(parsePermitError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-stretch rounded-xl border border-border/30 bg-card">
        <div className="flex flex-1 items-center gap-3 px-4 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 dark:bg-accent/10">
            <Eye className="size-4 text-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Confidential Balance
            </p>
            {decryptedBalance ? (
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {decryptedBalance} cUSD
              </span>
            ) : balanceCtHash ? (
              <div>
                <span className="text-sm font-semibold text-foreground">
                  Encrypted
                </span>
                <p className="font-mono text-[10px] text-muted-foreground break-all">
                  {balanceCtHash}
                </p>
              </div>
            ) : (
              <span className="text-sm font-semibold text-foreground">—</span>
            )}
          </div>

          {/* Decrypt button — only when encrypted and not yet decrypted */}
          {balanceCtHash && !decryptedBalance ? (
            <div className="relative group shrink-0">
              <Button
                variant="fhenix-cta"
                size="sm"
                onClick={handleDecrypt}
                disabled={!hasValidPermit || loading}
                className={!hasValidPermit ? "pointer-events-none" : ""}
              >
                {loading ? (
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                ) : (
                  <Lock className="size-3.5 mr-1.5" />
                )}
                {loading ? "Decrypting…" : "Decrypt"}
              </Button>
              {!hasValidPermit && !loading ? (
                <div className="pointer-events-none absolute top-full right-0 mt-2 w-max max-w-[220px] rounded-lg bg-foreground px-3 py-1.5 text-xs text-background text-center opacity-0 transition-opacity group-hover:opacity-100 z-50">
                  Requires an active self-permit for this wallet
                  <div className="absolute bottom-full right-4 border-4 border-transparent border-b-foreground" />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
