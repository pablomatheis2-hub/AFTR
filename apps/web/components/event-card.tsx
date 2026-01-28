"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Sun, Moon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateParts } from "@aftr/shared/utils";
import type { Event } from "@aftr/shared/types";

type EventWithCounts = Event & {
  pre_party_count: number;
  after_party_count: number;
};

interface EventCardProps {
  event: EventWithCounts;
}

export function EventCard({ event }: EventCardProps) {
  const dateParts = formatDateParts(event.event_date);

  return (
    <Link href={`/event/${event.id}`}>
      <Card className="overflow-hidden transition-all hover:bg-card/80 cursor-pointer">
        <div className="flex">
          {/* Date sidebar */}
          <div className="flex flex-col items-center justify-center w-20 py-4 bg-muted/30 shrink-0">
            <span className="text-xs uppercase text-muted-foreground">
              {dateParts.day}
            </span>
            <span className="text-2xl font-bold">{dateParts.date}</span>
            <span className="text-xs uppercase text-muted-foreground">
              {dateParts.month}
            </span>
          </div>

          {/* Content */}
          <CardContent className="flex-1 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{event.title}</h3>
                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-sm truncate">{event.venue}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span className="text-sm">{dateParts.time}</span>
                </div>
              </div>

              {/* Event image */}
              {event.image_url && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={event.image_url}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            {/* Party counts */}
            <div className="flex gap-2 mt-3">
              <Badge variant="secondary" className="gap-1">
                <Sun className="w-3 h-3" />
                {event.pre_party_count} previas
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Moon className="w-3 h-3" />
                {event.after_party_count} afters
              </Badge>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
