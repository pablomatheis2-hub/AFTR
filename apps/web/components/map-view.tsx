"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Party } from "@aftr/shared/types";

interface MapViewProps {
  parties: Array<Party & { latitude: number; longitude: number }>;
  center: { lat: number; lng: number };
}

export default function MapView({ parties, center }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map
    const map = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: 13,
      zoomControl: true,
    });

    // Add dark tile layer
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }
    ).addTo(map);

    // Custom marker icon
    const markerIcon = L.divIcon({
      className: "custom-marker",
      html: `<div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
        <div class="w-3 h-3 bg-black rounded-full"></div>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Add markers for each party
    parties.forEach((party) => {
      const marker = L.marker([party.latitude, party.longitude], {
        icon: markerIcon,
      }).addTo(map);

      marker.bindPopup(`
        <div class="p-2">
          <strong class="text-black">${party.title}</strong>
          <br />
          <span class="text-gray-600 text-sm">${party.address || "Sin dirección"}</span>
        </div>
      `);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map center when it changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([center.lat, center.lng], 13);
    }
  }, [center]);

  return (
    <>
      <style jsx global>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
      `}</style>
      <div ref={mapRef} className="h-[300px] w-full" />
    </>
  );
}
