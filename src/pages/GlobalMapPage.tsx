import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import { Container, Title, Loader, Center, Text, Paper, Badge } from '@mantine/core';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';

// --- CONFIGURATION DES ICÔNES LEAFLET ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28]
});
L.Marker.prototype.options.icon = DefaultIcon;
// ----------------------------------------

export default function GlobalMapPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get('/clients');
        // On ne garde que les clients qui ont une position GPS valide
        const geolocatedClients = res.data.filter((c: any) => 
            c.location && c.location.coordinates && c.location.coordinates.length === 2
        );
        setClients(geolocatedClients);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  if (loading) return <Center h={400}><Loader /></Center>;

  return (
    <Container size="xl" py="xl" h="85vh" style={{ display: 'flex', flexDirection: 'column' }}>
      <Title order={2} mb="lg">Carte Globale des Clients ({clients.length})</Title>
      
      <Paper shadow="md" withBorder style={{ flex: 1, overflow: 'hidden', borderRadius: 8 }}>
        <MapContainer 
            center={[-1.6585, 29.2205]} // Goma Centre
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {clients.map((client) => (
            <Marker 
                key={client.id} 
                // Attention: GeoJSON [Lng, Lat] -> Leaflet [Lat, Lng]
                // Comme on a corrigé le backend/frontend, vérifions l'ordre.
                // En général c'est [1] pour Lat, [0] pour Lng avec PostGIS GeoJSON
                position={[client.location.coordinates[1], client.location.coordinates[0]]}
            >
              {/* Tooltip = S'affiche au survol de la souris */}
              <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                {client.name}
              </Tooltip>

              {/* Popup = S'affiche au clic */}
              <Popup>
                <Text fw={700}>{client.name}</Text>
                <Text size="sm">{client.phone_number}</Text>
                <Text size="xs" c="dimmed">{client.street_address}</Text>
                <Text size="xs" c="dimmed">{client.district}</Text>
                <div style={{marginTop: 5}}>
                    {client.collection_days.map((day: string) => (
                        <Badge key={day} size="xs" mr={2} color="blue">{day.slice(0,3)}</Badge>
                    ))}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Paper>
    </Container>
  );
}