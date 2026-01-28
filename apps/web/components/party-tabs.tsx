"use client";

import { useState } from "react";
import Link from "next/link";
import { Sun, Moon, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PartyCard } from "@/components/party-card";
import type { Party, User } from "@aftr/shared/types";

type PartyWithHost = Party & {
  host: User;
  attendee_count: number;
  male_count: number;
  female_count: number;
};

interface PartyTabsProps {
  parties: PartyWithHost[];
  eventId: string;
  isEventTooOld: boolean;
}

export function PartyTabs({ parties, eventId, isEventTooOld }: PartyTabsProps) {
  const preParties = parties.filter((p) => p.type === "pre");
  const afterParties = parties.filter((p) => p.type === "after");

  return (
    <Tabs defaultValue="pre" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="pre" className="gap-2">
          <Sun className="w-4 h-4" />
          Previas ({preParties.length})
        </TabsTrigger>
        <TabsTrigger value="after" className="gap-2">
          <Moon className="w-4 h-4" />
          Afters ({afterParties.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pre">
        <PartyList
          parties={preParties}
          eventId={eventId}
          partyType="pre"
          isEventTooOld={isEventTooOld}
          emptyLabel="previas"
        />
      </TabsContent>

      <TabsContent value="after">
        <PartyList
          parties={afterParties}
          eventId={eventId}
          partyType="after"
          isEventTooOld={isEventTooOld}
          emptyLabel="afters"
        />
      </TabsContent>
    </Tabs>
  );
}

interface PartyListProps {
  parties: PartyWithHost[];
  eventId: string;
  partyType: "pre" | "after";
  isEventTooOld: boolean;
  emptyLabel: string;
}

function PartyList({
  parties,
  eventId,
  partyType,
  isEventTooOld,
  emptyLabel,
}: PartyListProps) {
  if (parties.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        {partyType === "pre" ? (
          <Sun className="w-12 h-12 text-muted-foreground mb-4" />
        ) : (
          <Moon className="w-12 h-12 text-muted-foreground mb-4" />
        )}
        <h3 className="text-lg font-semibold mb-1">No hay {emptyLabel} aún</h3>
        {isEventTooOld ? (
          <p className="text-muted-foreground">
            Este evento ya pasó hace más de 24 horas
          </p>
        ) : (
          <>
            <p className="text-muted-foreground mb-4">
              ¡Sé el primero en organizar una!
            </p>
            <Link href={`/create?eventId=${eventId}&type=${partyType}`}>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Crear {partyType === "pre" ? "Previa" : "After"}
              </Button>
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {parties.map((party) => (
        <PartyCard key={party.id} party={party} />
      ))}

      {!isEventTooOld && (
        <Link href={`/create?eventId=${eventId}&type=${partyType}`}>
          <Button variant="outline" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Organizar {partyType === "pre" ? "Previa" : "After"}
          </Button>
        </Link>
      )}
    </div>
  );
}
