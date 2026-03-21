import { useState } from "react";
import { Encryptable } from "@cofhe/sdk";
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

type EncryptableType = "bool" | "uint8" | "uint16" | "uint32" | "uint64" | "uint128" | "address";

const TYPES: EncryptableType[] = [
  "bool",
  "uint8",
  "uint16",
  "uint32",
  "uint64",
  "uint128",
  "address",
];

export function EncryptInput() {
  const { status, setLastEncryptedHash } = useCofheStore();
  const [selectedType, setSelectedType] = useState<EncryptableType>("uint32");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    ctHash: string;
    utype: string;
  } | null>(null);

  const isConnected = status === "connected";

  const handleEncrypt = async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      let encryptable;

      if (selectedType === "bool") {
        encryptable = Encryptable.bool(
          value === "true" || value === "1",
        );
      } else if (selectedType === "address") {
        encryptable = Encryptable.address(value);
      } else {
        const factory = Encryptable[selectedType];
        encryptable = factory(BigInt(value));
      }

      const [encrypted] = await cofheClient
        .encryptInputs([encryptable])
        .execute();

      const hash = String(encrypted.ctHash);
      setResult({
        ctHash: hash,
        utype: String(encrypted.utype),
      });
      setLastEncryptedHash(hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Encryption failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Encrypt Input</CardTitle>
        <CardDescription>
          Encrypt a value client-side before sending it to an FHE contract.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <div className="flex flex-wrap gap-1">
            {TYPES.map((t) => (
              <Button
                key={t}
                variant={selectedType === t ? "default" : "outline"}
                size="xs"
                onClick={() => {
                  setSelectedType(t);
                  setValue("");
                }}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Value</Label>
          <Input
            placeholder={
              selectedType === "bool"
                ? "true or false"
                : selectedType === "address"
                  ? "0x..."
                  : "Enter a number"
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        {result && (
          <div className="rounded border bg-muted/30 p-2 font-mono text-xs break-all space-y-1">
            <div>
              <span className="text-muted-foreground">ctHash: </span>
              {result.ctHash}
            </div>
            <div>
              <span className="text-muted-foreground">utype: </span>
              {result.utype}
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
          onClick={handleEncrypt}
          disabled={!isConnected || loading || !value}
        >
          {loading ? "Encrypting..." : "Encrypt"}
        </Button>
      </CardFooter>
    </Card>
  );
}
