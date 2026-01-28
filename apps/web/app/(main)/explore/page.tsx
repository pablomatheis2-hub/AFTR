"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, Loader2, Sun, Moon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PartyCard } from "@/components/party-card";
import { MainNav } from "@/components/main-nav";
import { useSupabase } from "@/app/providers";
import type { Party, User } from "@aftr/shared/types";
import { calculateGenderCounts } from "@aftr/shared/utils";

type PartyWithHost = Party & {
  host: User;
  attendee_count: number;
  male_count: number;
  female_count: number;
};

const MapComponent = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-muted flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

export default function ExplorePage() {
  const { supabase } = useSupabase();
  const [parties, setParties] = useState<PartyWithHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pre" | "after">("pre");

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: partiesData } = await supabase
      .from("parties")
      .select("*, host:users!host_id(*)")
      .gte("start_time", twentyFourHoursAgo)
      .order("start_time", { ascending: true });

    if (!partiesData || partiesData.length === 0) {
      setParties([]);
      setLoading(false);
      return;
    }

    const partyIds = partiesData.map((p) => p.id);
    const { data: allAttendees } = await supabase
      .from("party_attendees")
      .select("party_id, user:users!user_id(gender)")
      .in("party_id", partyIds);

    const attendeesByParty = new Map<
      string,
      Array<{ user?: { gender?: string } | null }>
    >();
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

    setParties(partiesWithCounts);
    setLoading(false);
  };

  const filteredParties = parties.filter((p) => p.type === activeTab);
  const partiesWithLocation = filteredParties.filter(
    (p) => p.latitude && p.longitude
  );

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto px-4 py-8 max-w-4xl pb-24 md:pb-8">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">Explorar</h1>
          <p className="text-muted-foreground mt-1">
            Encuentra fiestas cerca de ti
          </p>
        </header>

        {/* Map */}
        <div className="rounded-xl overflow-hidden mb-6">
          <MapComponent
            parties={partiesWithLocation}
            center={
              partiesWithLocation.length > 0
                ? {
                    lat: partiesWithLocation[0].latitude!,
                    lng: partiesWithLocation[0].longitude!,
                  }
                : { lat: 40.4168, lng: -3.7038 } // Madrid default
            }
          />
        </div>

        {/* Tabs and list */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "pre" | "after")}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="pre" className="gap-2">
              <Sun className="w-4 h-4" />
              Previas
            </TabsTrigger>
            <TabsTrigger value="after" className="gap-2">
              <Moon className="w-4 h-4" />
              Afters
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pre">
            <PartyListContent
              parties={filteredParties}
              loading={loading}
              type="pre"
            />
          </TabsContent>
          <TabsContent value="after">
            <PartyListContent
              parties={filteredParties}
              loading={loading}
              type="after"
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function PartyListContent({
  parties,
  loading,
  type,
}: {
  parties: PartyWithHost[];
  loading: boolean;
  type: "pre" | "after";
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (parties.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        {type === "pre" ? (
          <Sun className="w-12 h-12 text-muted-foreground mb-4" />
        ) : (
          <Moon className="w-12 h-12 text-muted-foreground mb-4" />
        )}
        <p className="text-lg font-semibold text-muted-foreground">
          No hay {type === "pre" ? "previas" : "afters"} disponibles
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {parties.map((party) => (
        <PartyCard key={party.id} party={party} />
      ))}
    </div>
  );
}
