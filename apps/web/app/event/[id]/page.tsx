import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, MapPin, Music } from "lucide-react";
import type { Database, Event, Party, User } from "@aftr/shared/types";
import { formatFullDate, formatTime, calculateGenderCounts } from "@aftr/shared/utils";
import { Button } from "@/components/ui/button";
import { PartyCard } from "@/components/party-card";
import { PartyTabs } from "@/components/party-tabs";
import type { Metadata } from "next";

type PartyWithHost = Party & {
  host: User;
  attendee_count: number;
  male_count: number;
  female_count: number;
};

async function getEventData(id: string) {
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

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (eventError || !event) {
    return { event: null, parties: [] };
  }

  const { data: partiesData, error: partiesError } = await supabase
    .from("parties")
    .select("*, host:users!host_id(*)")
    .eq("event_id", id)
    .order("start_time", { ascending: true });

  if (partiesError || !partiesData || partiesData.length === 0) {
    return { event, parties: [] };
  }

  const partyIds = partiesData.map((p) => p.id);
  const { data: allAttendees } = await supabase
    .from("party_attendees")
    .select("party_id, user:users!user_id(gender)")
    .in("party_id", partyIds);

  const attendeesByParty = new Map<string, Array<any>>();
  for (const attendee of allAttendees || []) {
    const list = attendeesByParty.get(attendee.party_id) || [];
    list.push(attendee);
    attendeesByParty.set(attendee.party_id, list);
  }

  const partiesWithCounts = partiesData.map((party) => {
    const attendees = attendeesByParty.get(party.id) || [];
    const counts = calculateGenderCounts(attendees);
    return {
      ...party,
      host: party.host as User,
      attendee_count: counts.total,
      male_count: counts.male,
      female_count: counts.female,
    };
  });

  return { event, parties: partiesWithCounts as PartyWithHost[] };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { event } = await getEventData(id);

  if (!event) {
    return {
      title: "Evento no encontrado - AFTR",
    };
  }

  return {
    title: `${event.title} - AFTR`,
    description: event.description || `${event.venue} - ${formatFullDate(event.event_date)}`,
    openGraph: {
      title: event.title,
      description: event.description || `${event.venue} - ${formatFullDate(event.event_date)}`,
      images: event.image_url ? [event.image_url] : [],
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { event, parties } = await getEventData(id);

  if (!event) {
    notFound();
  }

  const isEventTooOld =
    new Date(event.event_date) < new Date(Date.now() - 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-background">
      {/* Header image */}
      <div className="relative h-64 md:h-80">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Music className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <Link
          href="/"
          className="absolute top-4 left-4 p-2 rounded-full bg-background/80 backdrop-blur"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 max-w-4xl -mt-16 relative pb-24 md:pb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
          {event.title}
        </h1>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="w-5 h-5" />
            <span>{formatFullDate(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="w-5 h-5" />
            <span>{formatTime(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <MapPin className="w-5 h-5" />
            <span>{event.venue}</span>
          </div>
        </div>

        {event.description && (
          <p className="text-muted-foreground mb-6">{event.description}</p>
        )}

        {/* Parties section */}
        <PartyTabs
          parties={parties}
          eventId={event.id}
          isEventTooOld={isEventTooOld}
        />
      </main>
    </div>
  );
}
