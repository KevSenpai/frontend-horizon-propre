import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Text } from '@mantine/core';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Hack pour les icônes Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  onLocationSelect: (lat: number, lng: number) => void;
  initialPosition?: { lat: number, lng: number } | null; // <--- NOUVELLE PROPRIÉTÉ
}

// Sous-composant pour gérer les clics
function MapEvents({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Sous-composant pour recentrer la carte quand la position change
function MapRecenter({ position }: { position: { lat: number, lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 15);
    }
  }, [position]);
  return null;
}

export default function LocationPicker({ onLocationSelect, initialPosition }: Props) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  // 1. Initialisation : Si on reçoit une position existante, on l'affiche
  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    } else {
        setPosition(null); // Reset si création
    }
  }, [initialPosition]);

  const handleSelect = (lat: number, lng: number) => {
    setPosition({ lat, lng });
    onLocationSelect(lat, lng);
  };

  return (
    <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
      <MapContainer 
        center={[-1.6585, 29.2205]} // Goma par défaut
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onSelect={handleSelect} />
        {/* On ajoute le recentrage automatique */}
        <MapRecenter position={position} />
        {position && <Marker position={[position.lat, position.lng]} />}
      </MapContainer>
      {!position && (
        <Text size="xs" c="red" mt={5}>Aucune position définie. Cliquez sur la carte.</Text>
      )}
    </div>
  );
}