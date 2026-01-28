import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Calendar, MapPin, AlertCircle } from "lucide-react";
import type { Database } from "@aftr/shared/types";
import { formatDate, formatTime } from "@aftr/shared/utils";
import { EventCard } from "@/components/event-card";
import { MainNav } from "@/components/main-nav";

async function getEvents() {
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

  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const [eventsResult, partiesResult] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("is_active", true)
      .gte("event_date", twentyFourHoursAgo)
      .order("event_date", { ascending: true }),
    supabase.from("parties").select("event_id, type"),
  ]);

  if (eventsResult.error || partiesResult.error) {
    return { events: [], error: "No se pudieron cargar los eventos" };
  }

  const partyCounts = new Map<string, { pre: number; after: number }>();
  for (const party of partiesResult.data || []) {
    const counts = partyCounts.get(party.event_id) || { pre: 0, after: 0 };
    if (party.type === "pre") counts.pre++;
    else if (party.type === "after") counts.after++;
    partyCounts.set(party.event_id, counts);
  }

  const eventsWithCounts = (eventsResult.data || []).map((event) => {
    const counts = partyCounts.get(event.id) || { pre: 0, after: 0 };
    return {
      ...event,
      pre_party_count: counts.pre,
      after_party_count: counts.after,
    };
  });

  return { events: eventsWithCounts, error: null };
}

export default async function HomePage() {
  const { events, error } = await getEvents();

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-wider">AFTR</h1>
          <p className="text-muted-foreground mt-1 tracking-wide">
            Próximos Eventos
          </p>
        </header>

        {error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">
              No hay eventos próximos
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Vuelve más tarde para ver nuevos eventos
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
