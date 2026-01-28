"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/app/providers";

export default function OnboardingInstagramPage() {
  const router = useRouter();
  const { updateProfile } = useAuth();

  const [instagramHandle, setInstagramHandle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    setError(null);
    setSaving(true);

    const { error: updateError } = await updateProfile({
      instagram_handle: instagramHandle || null,
      onboarding_complete: true,
    });

    setSaving(false);

    if (updateError) {
      setError("No pudimos completar el registro. Intenta de nuevo.");
    } else {
      router.push("/");
    }
  };

  const handleSkip = async () => {
    setSaving(true);

    await updateProfile({
      onboarding_complete: true,
    });

    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Tu Instagram</h1>
          <p className="text-muted-foreground mt-2">Paso 2 de 2</p>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground text-center">
            Comparte tu Instagram para que otros asistentes puedan conectar
            contigo
          </p>

          <div className="space-y-2">
            <Label htmlFor="instagram">Usuario de Instagram</Label>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="instagram"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="tu_usuario"
                className="bg-input pl-10"
              />
            </div>
          </div>

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}

          <Button
            className="w-full"
            onClick={handleComplete}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Completar registro"
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleSkip}
            disabled={saving}
          >
            Saltar por ahora
          </Button>
        </div>
      </div>
    </div>
  );
}
