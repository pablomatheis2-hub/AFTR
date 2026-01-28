"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, Instagram, User } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MainNav } from "@/components/main-nav";
import { useAuth } from "@/app/providers";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [age, setAge] = useState(user?.age?.toString() || "");
  const [gender, setGender] = useState<string>(user?.gender || "");
  const [instagramHandle, setInstagramHandle] = useState(
    user?.instagram_handle || ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    const updates = {
      full_name: fullName || null,
      age: age ? parseInt(age) : null,
      gender: gender as "male" | "female" | "other" | null,
      instagram_handle: instagramHandle || null,
    };

    const { error: updateError } = await updateProfile(updates);

    setSaving(false);

    if (updateError) {
      setError("No pudimos actualizar tu perfil. Intenta de nuevo.");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const initial = user.full_name?.[0] || user.email?.[0] || "?";

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto px-4 py-8 max-w-2xl pb-24 md:pb-8">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">Perfil</h1>
        </header>

        {/* Profile header */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-20 h-20">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">{initial}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">
              {user.full_name || "Sin nombre"}
            </h2>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información personal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
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

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
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

              {success && (
                <p className="text-green-500 text-sm text-center">
                  Perfil actualizado correctamente
                </p>
              )}

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Button
          variant="outline"
          className="w-full gap-2 border-destructive text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </Button>
      </main>
    </div>
  );
}
