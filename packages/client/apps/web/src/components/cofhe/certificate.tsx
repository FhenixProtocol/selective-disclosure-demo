import { ShieldCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@client/ui/components/button";
import { ClientSetup } from "@/components/cofhe/client-setup";

interface CertificateProps {
  permit: Record<string, unknown>;
  isConnected: boolean;
  importStatus: "idle" | "loading" | "success" | "error";
  error?: string | null;
  onImport: () => void;
  onContinue: () => void;
}

function formatExpiration(exp: number) {
  if (!exp || exp === 0) return "No expiration";
  const date = new Date(exp * 1000);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function Certificate({
  permit,
  isConnected,
  importStatus,
  error,
  onImport,
  onContinue,
}: CertificateProps) {
  const issuer = (permit.issuer as string) ?? "Unknown";
  const recipient = (permit.recipient as string) ?? "Unknown";
  const name = (permit.name as string) || null;
  const expiration = (permit.expiration as number) ?? 0;
  const hash = (permit.hash as string) ?? (permit.signature as string) ?? null;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="rounded-xl border border-border/30 bg-card p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/20 dark:bg-accent/10">
            <ShieldCheck className="size-5 text-accent" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              Disclosure Certificate
            </p>
            <p className="text-xs text-muted-foreground">
              Confidential balance attestation permit
            </p>
          </div>
        </div>

        {/* Certificate fields */}
        <div className="rounded-lg border border-border/20 bg-secondary p-4 space-y-4">
          {name ? (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Permit Name
              </p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {name}
              </p>
            </div>
          ) : null}

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Issued By
            </p>
            <p className="mt-0.5 font-mono text-sm text-foreground break-all">
              {issuer}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Granted To
            </p>
            <p className="mt-0.5 font-mono text-sm text-foreground break-all">
              {recipient}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Expires
            </p>
            <p className="mt-0.5 text-sm text-foreground">
              {formatExpiration(expiration)}
            </p>
          </div>

          {hash ? (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Signature
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground break-all">
                {typeof hash === "string" ? hash : JSON.stringify(hash)}
              </p>
            </div>
          ) : null}
        </div>

        {/* Cryptographically signed badge */}
        <div className="rounded-lg border border-accent/30 bg-accent/8 dark:bg-accent/5 px-3 py-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-accent" />
            <span className="text-xs font-medium text-foreground">
              Cryptographically signed disclosure permit
            </span>
          </div>
        </div>

        {/* Action area */}
        {importStatus === "success" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/8 dark:bg-accent/5 px-3 py-2">
              <CheckCircle2 className="size-4 text-accent" />
              <span className="text-xs font-medium text-foreground">
                Disclosure permit imported successfully
              </span>
            </div>
            <Button
              variant="fhenix-cta"
              size="sm"
              className="w-full"
              onClick={onContinue}
            >
              Continue to Verification
            </Button>
          </div>
        ) : !isConnected ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Connect the recipient wallet to import this disclosure permit
            </p>
            <ClientSetup />
          </div>
        ) : (
          <div className="space-y-3">
            {error ? (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                <AlertCircle className="size-4 text-destructive shrink-0" />
                <span className="text-xs text-destructive">{error}</span>
              </div>
            ) : null}
            <Button
              variant="fhenix-cta"
              size="sm"
              className="w-full"
              onClick={onImport}
              disabled={importStatus === "loading"}
            >
              {importStatus === "loading" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Importing…
                </>
              ) : (
                "Import Disclosure Permit"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
