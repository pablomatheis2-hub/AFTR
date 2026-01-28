"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainNav } from "@/components/main-nav";
import { useSupabase, useAuth } from "@/app/providers";
import type { Event, PartyInsert } from "@aftr/shared/types";
import { formatDate } from "@aftr/shared/utils";

export default function CreatePartyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase } = useSupabase();
  const { session, user } = useAuth();

  const preselectedEventId = searchParams.get("eventId");
  const preselectedType = searchParams.get("type") as "pre" | "after" | null;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [eventId, setEventId] = useState(preselectedEventId || "");
  const [partyType, setPartyType] = useState<"pre" | "after">(
    preselectedType || "pre"
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [startTime, setStartTime] = useState("");
  const [minAge, setMinAge] = useState("18");
  const [maxAge, setMaxAge] = useState("99");
  const [maxCapacity, setMaxCapacity] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("is_active", true)
      .gte("event_date", twentyFourHoursAgo)
      .order("event_date", { ascending: true });

    setEvents(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!session?.user?.id) {
      router.push("/login");
      return;
    }

    if (!eventId || !title || !startTime) {
      setError("Por favor completa todos los campos obligatorios");
      return;
    }

    setSubmitting(true);

    const partyData: PartyInsert = {
      event_id: eventId,
      host_id: session.user.id,
      type: partyType,
      title,
      description: description || null,
      address: address || null,
      start_time: new Date(startTime).toISOString(),
      min_age: parseInt(minAge),
      max_age: parseInt(maxAge),
      max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
    };

    const { data, error: insertError } = await supabase
      .from("parties")
      .insert(partyData as any)
      .select()
      .single() as { data: { id: string } | null; error: any };

    if (insertError || !data) {
      setError("No pudimos crear la fiesta. Intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    router.push(`/party/${data.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto px-4 py-8 max-w-2xl pb-24 md:pb-8">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">Crear Fiesta</h1>
          <p className="text-muted-foreground mt-1">
            Organiza una previa o after
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Detalles de la fiesta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Party type */}
              <div className="space-y-2">
                <Label>Tipo de fiesta</Label>
                <Tabs
                  value={partyType}
                  onValueChange={(v) => setPartyType(v as "pre" | "after")}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pre" className="gap-2">
                      <Sun className="w-4 h-4" />
                      Previa
                    </TabsTrigger>
                    <TabsTrigger value="after" className="gap-2">
                      <Moon className="w-4 h-4" />
                      After
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Event selection */}
              <div className="space-y-2">
                <Label htmlFor="event">Evento *</Label>
                <Select value={eventId} onValueChange={setEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title} - {formatDate(event.event_date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Ej: After en mi casa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-input"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe tu fiesta..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-input"
                  rows={3}
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  placeholder="Ej: Calle Mayor 123"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-input"
                />
              </div>

              {/* Start time */}
              <div className="space-y-2">
                <Label htmlFor="startTime">Fecha y hora *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-input"
                />
              </div>

              {/* Age range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minAge">Edad mínima</Label>
                  <Input
                    id="minAge"
                    type="number"
                    min="18"
                    max="99"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAge">Edad máxima</Label>
                  <Input
                    id="maxAge"
                    type="number"
                    min="18"
                    max="99"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    className="bg-input"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="maxCapacity">Capacidad máxima (opcional)</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  min="1"
                  placeholder="Sin límite"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  className="bg-input"
                />
              </div>

              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Crear Fiesta"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
