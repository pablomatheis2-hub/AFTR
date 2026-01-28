"use client";

import Link from "next/link";
import { Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GenderRatio } from "@/components/gender-ratio";
import { formatTime } from "@aftr/shared/utils";
import type { Party, User } from "@aftr/shared/types";

type PartyWithHost = Party & {
  host: User;
  attendee_count: number;
  male_count: number;
  female_count: number;
};

interface PartyCardProps {
  party: PartyWithHost;
}

export function PartyCard({ party }: PartyCardProps) {
  const hostInitial = party.host?.full_name?.[0] || "?";

  return (
    <Link href={`/party/${party.id}`}>
      <Card className="overflow-hidden transition-all hover:bg-card/80 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={party.host?.avatar_url || undefined} />
              <AvatarFallback>{hostInitial}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{party.title}</h3>
              <p className="text-sm text-muted-foreground">
                @{party.host?.instagram_handle || party.host?.full_name || "Anónimo"}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(party.start_time)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>
                    {party.attendee_count}
                    {party.max_capacity && ` / ${party.max_capacity}`}
                  </span>
                </div>
              </div>

              {party.address && (
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{party.address}</span>
                </div>
              )}

              {/* Gender ratio bar */}
              {party.attendee_count > 0 && (
                <div className="mt-3">
                  <GenderRatio
                    male={party.male_count}
                    female={party.female_count}
                    total={party.attendee_count}
                  />
                </div>
              )}

              {/* Age range */}
              <div className="flex gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">
                  {party.min_age} - {party.max_age} años
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
