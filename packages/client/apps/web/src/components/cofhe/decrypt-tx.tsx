import { useState } from "react";
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
import { cofheClient } from "@/stores/cofhe-client";
import { useCofheStore } from "@/stores/cofhe-store";

export function DecryptTx() {
  const { status, lastEncryptedHash, setLastDecryptedTx } =
    useCofheStore();

  let hasActivePermit = false;
  try {
    hasActivePermit = !!cofheClient.permits.getActivePermit();
  } catch { /* not connected */ }
  const [ctHash, setCtHash] = useState("");
  const [usePermit, setUsePermit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    decryptedValue: string;
    signature: string;
  } | null>(null);

  const isConnected = status === "connected";

  const handleDecrypt = async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const hashInput = ctHash || lastEncryptedHash;
      if (!hashInput) {
        throw new Error("No ciphertext hash provided");
      }

      const builder = cofheClient.decryptForTx(hashInput);
      const decryptResult = usePermit
        ? await builder.withPermit().execute()
        : await builder.withoutPermit().execute();

      const value = String(decryptResult.decryptedValue);
      const sig = String(decryptResult.signature);
      setResult({ decryptedValue: value, signature: sig });
      setLastDecryptedTx(value, sig);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decryption failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>5. Decrypt for Transaction</CardTitle>
        <CardDescription>
          Decrypt with a verifiable signature for on-chain use. The signature
          can be submitted to a contract for verification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Ciphertext Hash</Label>
          <Input
            placeholder={
              lastEncryptedHash
                ? `Using last encrypted: ${lastEncryptedHash.slice(0, 20)}...`
                : "Enter ctHash from contract"
            }
            value={ctHash}
            onChange={(e) => setCtHash(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={usePermit ? "default" : "outline"}
            size="xs"
            onClick={() => setUsePermit(true)}
          >
            With Permit
          </Button>
          <Button
            variant={!usePermit ? "default" : "outline"}
            size="xs"
            onClick={() => setUsePermit(false)}
          >
            Without Permit
          </Button>
        </div>

        {usePermit && !hasActivePermit && (
          <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-2 text-xs text-yellow-600 dark:text-yellow-400">
            Create a permit first (step 2) to use permit-based decryption.
          </div>
        )}

        {result && (
          <div className="rounded border bg-muted/30 p-2 font-mono text-xs break-all space-y-1">
            <div>
              <span className="text-muted-foreground">Decrypted Value: </span>
              {result.decryptedValue}
            </div>
            <div>
              <span className="text-muted-foreground">Signature: </span>
              {result.signature}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          size="sm"
          onClick={handleDecrypt}
          disabled={
            !isConnected || (usePermit && !hasActivePermit) || loading
          }
        >
          {loading ? "Decrypting..." : "Decrypt for Tx"}
        </Button>
      </CardFooter>
    </Card>
  );
}
