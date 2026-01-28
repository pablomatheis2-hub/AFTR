import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <FileQuestion className="w-16 h-16 mx-auto text-muted-foreground" />

        <div>
          <h1 className="text-2xl font-bold">Página no encontrada</h1>
          <p className="text-muted-foreground mt-2">
            La página que buscas no existe o ha sido movida.
          </p>
        </div>

        <Link href="/">
          <Button className="w-full">Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}
