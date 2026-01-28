"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/app/providers";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { updateProfile } = useAuth();

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setError(null);

    if (!fullName || !age || !gender) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (parseInt(age) < 18) {
      setError("Debes ser mayor de 18 años");
      return;
    }

    setSaving(true);

    const { error: updateError } = await updateProfile({
      full_name: fullName,
      age: parseInt(age),
      gender: gender as "male" | "female" | "other",
    });

    setSaving(false);

    if (updateError) {
      setError("No pudimos guardar tu perfil. Intenta de nuevo.");
    } else {
      router.push("/onboarding/instagram");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Cuéntanos sobre ti</h1>
          <p className="text-muted-foreground mt-2">Paso 1 de 2</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
              className="bg-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Edad</Label>
            <Input
              id="age"
              type="number"
              min="18"
              max="99"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Tu edad"
              className="bg-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Género</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="Selecciona tu género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Hombre</SelectItem>
                <SelectItem value="female">Mujer</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}

          <Button
            className="w-full"
            onClick={handleContinue}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Continuar"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
