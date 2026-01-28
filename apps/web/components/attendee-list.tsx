"use client";

import { Instagram } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@aftr/shared/types";

interface AttendeeListProps {
  attendees: User[];
}

export function AttendeeList({ attendees }: AttendeeListProps) {
  if (attendees.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Aún no hay asistentes
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {attendees.map((attendee) => (
        <div key={attendee.id} className="flex flex-col items-center gap-2">
          <Avatar className="w-16 h-16">
            <AvatarImage src={attendee.avatar_url || undefined} />
            <AvatarFallback className="text-lg">
              {attendee.full_name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="font-medium text-sm truncate max-w-[100px]">
              {attendee.full_name || "Anónimo"}
            </p>
            {attendee.instagram_handle && (
              <a
                href={`https://instagram.com/${attendee.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram className="w-3 h-3" />@{attendee.instagram_handle}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
