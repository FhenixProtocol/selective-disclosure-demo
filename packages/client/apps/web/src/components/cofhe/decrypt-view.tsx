import { useState } from "react";
import { FheTypes } from "@cofhe/sdk";
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

const FHE_TYPE_OPTIONS = [
  { label: "Bool", value: FheTypes.Bool },
  { label: "Uint8", value: FheTypes.Uint8 },
  { label: "Uint16", value: FheTypes.Uint16 },
  { label: "Uint32", value: FheTypes.Uint32 },
  { label: "Uint64", value: FheTypes.Uint64 },
  { label: "Uint128", value: FheTypes.Uint128 },
  { label: "Address", value: FheTypes.Uint160 },
] as const;

export function DecryptView() {
  const { status, lastEncryptedHash, setLastDecryptedView } =
    useCofheStore();

  let hasActivePermit = false;
  try {
    hasActivePermit = !!cofheClient.permits.getActivePermit();
  } catch { /* not connected */ }
  const [ctHash, setCtHash] = useState("");
  const [fheType, setFheType] = useState(FheTypes.Uint32);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

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

      const plaintext = await cofheClient
        .decryptForView(hashInput, fheType)
        .execute();

      const display = String(plaintext);
      setResult(display);
      setLastDecryptedView(display);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decryption failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>4. Decrypt for View</CardTitle>
        <CardDescription>
          Decrypt an on-chain ciphertext for off-chain display. Requires an
          active permit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasActivePermit && (
          <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-2 text-xs text-yellow-600 dark:text-yellow-400">
            Create a permit first (step 2) before decrypting.
          </div>
        )}

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

        <div className="space-y-1.5">
          <Label className="text-xs">FHE Type</Label>
          <div className="flex flex-wrap gap-1">
            {FHE_TYPE_OPTIONS.map((opt) => (
              <Button
                key={opt.label}
                variant={fheType === opt.value ? "default" : "outline"}
                size="xs"
                onClick={() => setFheType(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {result !== null && (
          <div className="rounded border bg-muted/30 p-2 font-mono text-xs break-all">
            <span className="text-muted-foreground">Plaintext: </span>
            {result}
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
          disabled={!isConnected || !hasActivePermit || loading}
        >
          {loading ? "Decrypting..." : "Decrypt for View"}
        </Button>
      </CardFooter>
    </Card>
  );
}
