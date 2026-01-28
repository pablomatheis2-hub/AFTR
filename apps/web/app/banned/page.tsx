"use client";

import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/providers";

export default function BannedPage() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <ShieldX className="w-16 h-16 mx-auto text-destructive" />

        <div>
          <h1 className="text-2xl font-bold">Cuenta suspendida</h1>
          <p className="text-muted-foreground mt-2">
            Tu cuenta ha sido suspendida por violar nuestras normas de
            comunidad.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Si crees que esto es un error, por favor contacta con nuestro equipo
          de soporte.
        </p>

        <Button variant="outline" className="w-full" onClick={signOut}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
