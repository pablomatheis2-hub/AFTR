"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <Image
          src="/logo.png"
          alt="AFTR"
          width={120}
          height={120}
          className="mx-auto"
        />

        <div>
          <h1 className="text-3xl font-extrabold tracking-wider">AFTR</h1>
          <p className="text-muted-foreground mt-2">
            Todo empieza antes de entrar al club
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            Descubre y organiza previas y afters para tus eventos favoritos
          </p>
        </div>

        <Button
          className="w-full"
          onClick={() => router.push("/onboarding/profile-setup")}
        >
          Empezar
        </Button>
      </div>
    </div>
  );
}
