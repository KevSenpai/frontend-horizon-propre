import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Paper, Title, Text, Button, Group, Badge, ActionIcon, ScrollArea, LoadingOverlay } from '@mantine/core';
import { IconArrowLeft, IconPlus, IconTrash, IconGripVertical, IconCheck, IconX, IconBolt, IconPrinter } from '@tabler/icons-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; // <--- IMPORT CARTE
import L from 'leaflet'; // Pour l'icône camion
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket'; // <--- IMPORT SOCKET

// Hack pour l'icône camion (Emoji ou Image)
const truckIcon = L.divIcon({
  html: '<div style="font-size: 24px;">🚚</div>',
  className: 'truck-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

export default function TourDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [tour, setTour] = useState<any>(null);
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [tourClients, setTourClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // État pour la position du camion (Temps Réel)
  const [truckPosition, setTruckPosition] = useState<{lat: number, lng: number} | null>(null);

  const isEditable = tour?.status === 'DRAFT';

  // 1. Chargement des données + WebSocket
  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const tourRes = await api.get(`/tours/${id}`);
      setTour(tourRes.data);
      const assignedRes = await api.get(`/tour-clients/tour/${id}`);
      setTourClients(assignedRes.data);
      const allClientsRes = await api.get('/clients');
      const assignedIds = new Set(assignedRes.data.map((tc: any) => tc.clientId));
      const available = allClientsRes.data.filter((c: any) => !assignedIds.has(c.id) && c.status === 'ACTIVE');
      setAvailableClients(available);
    } catch (error) {
      console.error("Erreur chargement", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // --- MISE EN PLACE DU TEMPS RÉEL ---
    const socket = connectSocket();

    // Écouter la position du camion pour CETTE tournée
    socket.on(`trackTour:${id}`, (data: { lat: number, lng: number }) => {
        console.log("🚚 Nouvelle position reçue :", data);
        setTruckPosition({ lat: data.lat, lng: data.lng });
    });

    // Écouter l'avancement (quand le mobile valide une collecte)
    socket.on(`tourProgress:${id}`, (data) => {
        console.log("✅ Collecte validée en direct !");
        // On recharge les données pour mettre à jour la liste (ou on pourrait le faire localement)
        loadData();
    });

    return () => {
        socket.off(`trackTour:${id}`);
        socket.off(`tourProgress:${id}`);
        disconnectSocket();
    };
  }, [id]);

  // ... (Garder les fonctions handleAdd, handleRemove, onDragEnd, changeStatus, handleAutoPlan, handleDownloadPdf à l'identique) ...
  // Pour ne pas surcharger la réponse, je remets les fonctions clés simplifiées ici, 
  // MAIS gardez votre logique existante pour ces fonctions !

  const handleAddClient = async (client: any) => { /* ... code existant ... */ };
  const handleRemoveClient = async (clientId: string) => { /* ... code existant ... */ };
  const onDragEnd = (result: any) => { /* ... code existant ... */ };
  const changeStatus = async (newStatus: string) => { /* ... code existant ... */ };
  const handleAutoPlan = async () => { /* ... code existant ... */ };
  const handleDownloadPdf = () => {
    const pdfUrl = `${api.defaults.baseURL}/tours/${id}/pdf`;
    window.open(pdfUrl, '_blank');
  };
  const getStatusColor = (status: string) => { /* ... code existant ... */ return 'gray'; };


  if (!tour) return <div>Chargement...</div>;

  return (
    <Container size="xl" py="xl">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      
      {/* HEADER */}
      <Paper withBorder p="md" mb="lg" shadow="xs">
        <Group justify="space-between">
          <Group>
            <Button variant="subtle" leftSection={<IconArrowLeft />} onClick={() => navigate('/planning')}>
              Retour
            </Button>
            <div>
              <Title order={2}>{tour.name}</Title>
              <Text c="dimmed" size="sm">
                {tour.tour_date} • {tour.team?.name} • {tour.vehicle?.name}
              </Text>
            </div>
          </Group>
          <Group>
            <Button variant="default" leftSection={<IconPrinter size={16}/>} onClick={handleDownloadPdf}>
                Imprimer
            </Button>
            <Badge size="xl" variant="light" color="blue">{tour.status}</Badge>
            {/* ... Boutons Valider/Annuler (Gardez votre code existant ici) ... */}
          </Group>
        </Group>
      </Paper>

      {/* --- CARTE TEMPS RÉEL (NOUVEAU) --- */}
      {['PLANNED', 'IN_PROGRESS'].includes(tour.status) && (
          <Paper withBorder p="0" mb="lg" h={300} style={{ overflow: 'hidden', position: 'relative' }}>
              <MapContainer 
                center={truckPosition ? [truckPosition.lat, truckPosition.lng] : [-1.6585, 29.2205]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {/* Marqueurs des clients */}
                {tourClients.map((tc: any) => {
                    const coords = tc.client?.location?.coordinates;
                    if(coords) {
                        return <Marker key={tc.clientId} position={[coords[0], coords[1]]} />
                    }
                    return null;
                })}

                {/* Marqueur du Camion (Temps Réel) */}
                {truckPosition && (
                    <Marker position={[truckPosition.lat, truckPosition.lng]} icon={truckIcon}>
                        <Popup>Camion en mouvement</Popup>
                    </Marker>
                )}
              </MapContainer>
              
              {!truckPosition && (
                  <div style={{ position: 'absolute', top: 10, right: 10, background: 'white', padding: 5, borderRadius: 5, zIndex: 1000 }}>
                      <Text size="xs" c="dimmed">En attente du signal GPS...</Text>
                  </div>
              )}
          </Paper>
      )}

      {/* ... GRILLES CLIENTS (Gardez votre code existant pour Grid, Col gauche/droite) ... */}
      <Grid>
         {/* ... Copiez-collez votre code existant pour les listes ... */}
      </Grid>
    </Container>
  );
}