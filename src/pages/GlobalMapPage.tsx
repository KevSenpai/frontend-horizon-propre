import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import { Container, Title, Loader, Center, Text, Paper, Badge, Group, SegmentedControl, Avatar } from '@mantine/core';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IconTruck, IconUser } from '@tabler/icons-react';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

// --- CONFIGURATION DES ICÔNES ---
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Icône Client (Bleu standard)
const ClientIcon = L.icon({
    iconUrl: iconMarker,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28]
});

// Icône Camion (Emoji ou image perso)
const TruckIcon = L.divIcon({
  html: '<div style="font-size: 30px; filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.3));">🚚</div>',
  className: 'truck-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  tooltipAnchor: [20, 0]
});

// Icône Camion "En Attente" (Grisé)
const TruckWaitingIcon = L.divIcon({
  html: '<div style="font-size: 30px; filter: grayscale(100%);">🚚</div>',
  className: 'truck-icon-gray',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  tooltipAnchor: [20, 0]
});
// --------------------------------

export default function GlobalMapPage() {
  const [viewMode, setViewMode] = useState('clients'); // 'clients' | 'tours'
  const [loading, setLoading] = useState(true);

  // Données
  const [clients, setClients] = useState<any[]>([]);
  const [activeTours, setActiveTours] = useState<any[]>([]);
  
  // Positions temps réel des camions { tourId: {lat, lng} }
  const [fleetPositions, setFleetPositions] = useState<Record<string, {lat: number, lng: number}>>({});

  // 1. Chargement des données statiques
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // A. Charger les clients
        const resClients = await api.get('/clients');
        const geolocated = resClients.data.filter((c: any) => 
            c.location && c.location.coordinates
        );
        setClients(geolocated);

        // B. Charger les tournées du jour (Planifiées ou En cours)
        const resTours = await api.get('/tours');
        const today = new Date().toISOString().split('T')[0];
        const todaysTours = resTours.data.filter((t: any) => 
            t.tour_date === today && 
            ['PLANNED', 'IN_PROGRESS'].includes(t.status)
        );
        setActiveTours(todaysTours);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Gestion des WebSockets pour les tournées "En Cours"
  useEffect(() => {
    if (viewMode !== 'tours') return;

    const socket = connectSocket();
    const toursInProgress = activeTours.filter(t => t.status === 'IN_PROGRESS');

    // On s'abonne à chaque tournée active
    toursInProgress.forEach(tour => {
        socket.on(`trackTour:${tour.id}`, (data: { lat: number, lng: number }) => {
            setFleetPositions(prev => ({
                ...prev,
                [tour.id]: data // Mise à jour de la position de CE camion
            }));
        });
    });

    return () => {
        // Nettoyage des écouteurs
        toursInProgress.forEach(tour => {
            socket.off(`trackTour:${tour.id}`);
        });
        // On ne déconnecte pas le socket global car il peut servir ailleurs, 
        // mais ici on pourrait si c'est la seule page.
    };
  }, [viewMode, activeTours]);

  if (loading) return <Center h={400}><Loader /></Center>;

  return (
    <Container size="xl" py="xl" h="85vh" style={{ display: 'flex', flexDirection: 'column' }}>
      
      <Group justify="space-between" mb="md" align="center">
        <Title order={2}>Carte Globale</Title>
        
        {/* LE SWITCHER DE VUE */}
        <SegmentedControl
            value={viewMode}
            onChange={setViewMode}
            size="md"
            data={[
                { 
                    value: 'clients', 
                    label: (
                        <Center>
                            <IconUser size={16} />
                            <Text ml={5}>Clients ({clients.length})</Text>
                        </Center>
                    ) 
                },
                { 
                    value: 'tours', 
                    label: (
                        <Center>
                            <IconTruck size={16} />
                            <Text ml={5}>Flotte Active ({activeTours.length})</Text>
                        </Center>
                    ) 
                },
            ]}
        />
      </Group>
      
      <Paper shadow="md" withBorder style={{ flex: 1, overflow: 'hidden', borderRadius: 8 }}>
        <MapContainer 
            center={[-1.6585, 29.2205]} // Goma
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* --- MODE CLIENTS --- */}
          {viewMode === 'clients' && clients.map((client) => (
            <Marker 
                key={client.id} 
                icon={ClientIcon}
                position={[client.location.coordinates[1], client.location.coordinates[0]]}
            >
              <Tooltip direction="top" offset={[0, -20]} opacity={1}>{client.name}</Tooltip>
              <Popup>
                <Text fw={700}>{client.name}</Text>
                <Text size="xs">{client.street_address}</Text>
                <Text size="xs" c="dimmed">{client.district}</Text>
              </Popup>
            </Marker>
          ))}

          {/* --- MODE TOURNÉES (FLOTTE) --- */}
          {viewMode === 'tours' && activeTours.map((tour) => {
            const isMoving = tour.status === 'IN_PROGRESS';
            // Si on a une position GPS en direct, on la prend.
            // Sinon, si c'est "Planifié" ou qu'on a pas encore de signal, on met au Dépôt (Goma Centre)
            const livePos = fleetPositions[tour.id];
            const displayPos: [number, number] = livePos 
                ? [livePos.lat, livePos.lng] 
                : [-1.6585, 29.2205]; // Position par défaut (Dépôt)

            return (
                <Marker 
                    key={tour.id} 
                    icon={isMoving ? TruckIcon : TruckWaitingIcon}
                    position={displayPos}
                >
                    {/* Infos au survol */}
                    <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                        {tour.team?.name || 'Équipe'}
                    </Tooltip>

                    {/* Détails au clic */}
                    <Popup>
                        <Group mb={5}>
                            <Badge color={isMoving ? 'orange' : 'blue'}>
                                {isMoving ? 'EN MOUVEMENT' : 'EN ATTENTE'}
                            </Badge>
                        </Group>
                        <Text fw={700} size="sm">{tour.name}</Text>
                        <Text size="xs">Équipe : {tour.team?.name}</Text>
                        <Text size="xs">Véhicule : {tour.vehicle?.name}</Text>
                        {isMoving && !livePos && (
                            <Text c="red" size="xs" mt={2}>Signal GPS en attente...</Text>
                        )}
                    </Popup>
                </Marker>
            );
          })}

        </MapContainer>
      </Paper>
    </Container>
  );
}