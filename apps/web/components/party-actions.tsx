"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSupabase, useAuth } from "@/app/providers";
import type { User } from "@aftr/shared/types";

interface PartyActionsProps {
  partyId: string;
  hostId: string;
  maxCapacity: number | null;
  minAge: number;
  maxAge: number;
  initialAttendees: User[];
}

export function PartyActions({
  partyId,
  hostId,
  maxCapacity,
  minAge,
  maxAge,
  initialAttendees,
}: PartyActionsProps) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { session, user } = useAuth();
  const [attendees, setAttendees] = useState(initialAttendees);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isHost = session?.user?.id === hostId;

  useEffect(() => {
    if (session?.user?.id) {
      setIsJoined(attendees.some((a) => a.id === session.user.id));
    }
  }, [session, attendees]);

  const handleJoinLeave = async () => {
    if (!session?.user?.id) {
      router.push("/login");
      return;
    }

    if (!isJoined) {
      if (maxCapacity && attendees.length >= maxCapacity) {
        alert("Esta fiesta ha alcanzado su capacidad máxima");
        return;
      }

      if (user?.age && (user.age < minAge || user.age > maxAge)) {
        alert(`Esta fiesta es para edades ${minAge}-${maxAge}`);
        return;
      }
    }

    setLoading(true);

    if (isJoined) {
      const { error } = await supabase
        .from("party_attendees")
        .delete()
        .eq("party_id", partyId)
        .eq("user_id", session.user.id);

      if (!error) {
        setIsJoined(false);
        setAttendees(attendees.filter((a) => a.id !== session.user.id));
      }
    } else {
      const { error } = await supabase.from("party_attendees").insert({
        party_id: partyId,
        user_id: session.user.id,
      });

      if (!error && user) {
        setIsJoined(true);
        setAttendees([...attendees, user]);
      }
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from("parties")
      .delete()
      .eq("id", partyId);

    if (!error) {
      router.push("/");
    } else {
      setDeleting(false);
      alert("No pudimos eliminar la fiesta");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 md:pb-4 border-t bg-background/95 backdrop-blur">
      <div className="container max-w-4xl mx-auto">
        {isHost ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full gap-2 border-destructive text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Fiesta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar Fiesta</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de que quieres eliminar esta fiesta? Esta acción
                  no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Eliminar"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            variant={isJoined ? "outline" : "default"}
            className="w-full"
            onClick={handleJoinLeave}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isJoined ? (
              "Salir de la Fiesta"
            ) : (
              "Unirse a la Fiesta"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
