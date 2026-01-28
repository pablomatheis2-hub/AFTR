import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Sun,
  Moon,
  Music,
  Instagram,
} from "lucide-react";
import type { Database, Party, User, Event } from "@aftr/shared/types";
import { formatFullDate, formatTime } from "@aftr/shared/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GenderRatio } from "@/components/gender-ratio";
import { AttendeeList } from "@/components/attendee-list";
import { PartyActions } from "@/components/party-actions";
import type { Metadata } from "next";

type PartyDetail = Party & {
  host: User;
  event: Event;
};

async function getPartyData(id: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: party, error } = await supabase
    .from("parties")
    .select("*, host:users!host_id(*), event:events!event_id(*)")
    .eq("id", id)
    .single();

  if (error || !party) {
    return { party: null, attendees: [] };
  }

  const { data: attendeesData } = await supabase
    .from("party_attendees")
    .select("user:users!user_id(*)")
    .eq("party_id", id);

  const attendees =
    attendeesData?.map((a: any) => Array.isArray(a.user) ? a.user[0] : a.user).filter(Boolean) || [];

  return {
    party: party as PartyDetail,
    attendees: attendees as User[],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { party } = await getPartyData(id);

  if (!party) {
    return {
      title: "Fiesta no encontrada - AFTR",
    };
  }

  const partyType = party.type === "pre" ? "Previa" : "After";

  return {
    title: `${party.title} - ${partyType} - AFTR`,
    description: `${partyType} para ${party.event?.title || "evento"} - ${formatFullDate(party.start_time)} a las ${formatTime(party.start_time)}`,
  };
}

export default async function PartyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { party, attendees } = await getPartyData(id);

  if (!party) {
    notFound();
  }

  const maleCount = attendees.filter((a) => a.gender === "male").length;
  const femaleCount = attendees.filter((a) => a.gender === "female").length;
  const hostInitial = party.host?.full_name?.[0] || "?";

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Type banner */}
      <div className="flex items-center justify-center gap-2 py-3 bg-foreground text-background">
        {party.type === "pre" ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
        <span className="font-bold">
          {party.type === "pre" ? "Previa" : "After"}
        </span>
      </div>

      {/* Back button */}
      <div className="container max-w-4xl mx-auto px-4 py-4">
        <Link
          href={party.event ? `/event/${party.event.id}` : "/"}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>

      {/* Content */}
      <main className="container max-w-4xl mx-auto px-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-3xl font-extrabold">{party.title}</h1>
        </div>

        {/* Event link */}
        {party.event && (
          <Link href={`/event/${party.event.id}`}>
            <Card className="mb-6 hover:bg-card/80 transition-colors">
              <CardContent className="flex items-center gap-3 p-4">
                <Music className="w-5 h-5 text-muted-foreground shrink-0" />
                <span className="flex-1 font-medium">{party.event.title}</span>
                <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Host card */}
        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 p-4">
            <Avatar className="w-14 h-14 border-2 border-foreground">
              <AvatarImage src={party.host?.avatar_url || undefined} />
              <AvatarFallback className="text-lg">{hostInitial}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Anfitrión</p>
              <p className="font-bold text-lg">{party.host?.full_name}</p>
              {party.host?.instagram_handle && (
                <a
                  href={`https://instagram.com/${party.host.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Instagram className="w-4 h-4" />@{party.host.instagram_handle}
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details card */}
        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="font-semibold">
                  {formatFullDate(party.start_time)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Hora</p>
                <p className="font-semibold">{formatTime(party.start_time)}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Ubicación</p>
                <p className="font-semibold">
                  {party.address || "Sin dirección"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Rango de Edad</p>
                <p className="font-semibold">
                  {party.min_age} - {party.max_age} años
                </p>
              </div>
            </div>

            {party.max_capacity && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Capacidad</p>
                    <p className="font-semibold">
                      {attendees.length} / {party.max_capacity}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        {party.description && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">Descripción</h2>
            <p className="text-muted-foreground">{party.description}</p>
          </div>
        )}

        {/* Gender ratio */}
        {attendees.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">Proporción de género</h2>
            <GenderRatio
              male={maleCount}
              female={femaleCount}
              total={attendees.length}
            />
          </div>
        )}

        {/* Attendees */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">
            Asistentes ({attendees.length})
          </h2>
          <AttendeeList attendees={attendees} />
        </div>
      </main>

      {/* Footer actions */}
      <PartyActions
        partyId={party.id}
        hostId={party.host_id}
        maxCapacity={party.max_capacity}
        minAge={party.min_age}
        maxAge={party.max_age}
        initialAttendees={attendees}
      />
    </div>
  );
}
