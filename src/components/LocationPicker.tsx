import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Text } from '@mantine/core';
import L from 'leaflet';

// Hack pour afficher les icônes Leaflet correctement dans React
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
}

// Sous-composant pour gérer le clic sur la carte
function MapEvents({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ onLocationSelect }: Props) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  const handleSelect = (lat: number, lng: number) => {
    setPosition({ lat, lng });
    onLocationSelect(lat, lng);
  };

  return (
    <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
      {/* Centré sur Goma par défaut */}
      <MapContainer center={[-1.6585, 29.2205]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onSelect={handleSelect} />
        {position && <Marker position={[position.lat, position.lng]} />}
      </MapContainer>
      {!position && (
        <Text size="xs" c="red" mt={5}>Cliquez sur la carte pour définir la position GPS *</Text>
      )}
    </div>
  );
}