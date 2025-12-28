import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Paper, Title, Text, Button, Group, Badge, ActionIcon, ScrollArea, LoadingOverlay, ThemeIcon, Progress } from '@mantine/core';
import { IconArrowLeft, IconPlus, IconTrash, IconGripVertical, IconCheck, IconX, IconBolt, IconPrinter } from '@tabler/icons-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

// Icône Camion pour la carte
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
  const [truckPosition, setTruckPosition] = useState<{lat: number, lng: number} | null>(null);

  const isEditable = tour?.status === 'DRAFT';

  // Calcul de la progression (Temps Réel)
  const totalStops = tourClients.length;
  // On compte ceux qui ont un statut 'COMPLETED' (via Socket ou BDD)
  const completedStops = tourClients.filter((tc: any) => tc.lastStatus === 'COMPLETED').length;
  const progressPercent = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

  // 1. Chargement initial
  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // a. Infos tournée
      const tourRes = await api.get(`/tours/${id}`);
      setTour(tourRes.data);

      // b. Clients dans la tournée
      // Note: Dans une version avancée, l'API devrait aussi renvoyer le statut 'isCollected'
      // Pour le MVP, on se base sur le WebSocket pour le temps réel
      const assignedRes = await api.get(`/tour-clients/tour/${id}`);
      setTourClients(assignedRes.data);

      // c. Clients disponibles
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

  // 2. Gestion WebSockets (Temps Réel)
  useEffect(() => {
    loadData();

    const socket = connectSocket();

    // A. Écoute Position Camion
    socket.on(`trackTour:${id}`, (data: { lat: number, lng: number }) => {
        setTruckPosition({ lat: data.lat, lng: data.lng });
    });

    // B. Écoute Validation Collecte (Mise à jour liste & barre de progression)
    socket.on(`tourProgress:${id}`, (payload: { clientId: string, status: string }) => {
        setTourClients(currentList => currentList.map(item => {
            if (item.clientId === payload.clientId) {
                // On met à jour le statut localement pour l'effet visuel immédiat
                return { ...item, lastStatus: payload.status };
            }
            return item;
        }));
    });

    return () => {
        socket.off(`trackTour:${id}`);
        socket.off(`tourProgress:${id}`);
        disconnectSocket();
    };
  }, [id]);

  // 3. Actions (Ajout, Retrait, Drag&Drop, Statuts...)
  
  const handleAddClient = async (client: any) => {
    if (!isEditable) return; 
    try {
      const newPosition = tourClients.length + 1;
      await api.post('/tour-clients', { tourId: id, clientId: client.id, position: newPosition });
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleRemoveClient = async (clientId: string) => {
    if (!isEditable) return;
    if(!confirm("Retirer ce client de la tournée ?")) return;
    try {
      await api.delete(`/tour-clients/${id}/${clientId}`);
      loadData();
    } catch (e) { console.error(e); }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination || !isEditable) return;
    const items = Array.from(tourClients);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setTourClients(items);
    // TODO: Sauvegarde ordre API
  };

  const changeStatus = async (newStatus: string) => {
    if (newStatus === 'PLANNED' && !confirm("Valider cette tournée ?")) return;
    if (newStatus === 'CANCELLED' && !confirm("Annuler cette tournée ?")) return;
    try {
      await api.patch(`/tours/${id}`, { status: newStatus });
      loadData();
    } catch (e) { alert("Erreur statut"); }
  };

  const handleAutoPlan = async () => {
    if (!isEditable || !confirm("Remplacer la liste par une suggestion auto ?")) return;
    setLoading(true);
    try {
      const res = await api.post(`/tours/${id}/auto-plan`);
      alert(`Terminé ! ${res.data.count} clients ajoutés.`);
      loadData(); 
    } catch (e) { alert("Erreur auto-plan"); } finally { setLoading(false); }
  };

  const handleDownloadPdf = () => {
    const pdfUrl = `${api.defaults.baseURL}/tours/${id}/pdf`;
    window.open(pdfUrl, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'gray';
      case 'PLANNED': return 'blue';
      case 'IN_PROGRESS': return 'orange';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  if (!tour) return <div>Chargement...</div>;

  return (
    <Container size="xl" py="xl">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      
      {/* HEADER */}
      <Paper withBorder p="md" mb="lg" shadow="xs">
        <Group justify="space-between">
          <Group>
            <Button variant="subtle" leftSection={<IconArrowLeft />} onClick={() => navigate('/planning')}>Retour</Button>
            <div>
              <Title order={2}>{tour.name}</Title>
              <Text c="dimmed" size="sm">{tour.tour_date} • {tour.team?.name} • {tour.vehicle?.name}</Text>
            </div>
          </Group>
          <Group>
            <Button variant="default" leftSection={<IconPrinter size={16}/>} onClick={handleDownloadPdf}>Imprimer</Button>
            <Badge size="xl" variant="light" color={getStatusColor(tour.status)}>{tour.status}</Badge>
            {tour.status === 'DRAFT' && <Button color="green" leftSection={<IconCheck size={16}/>} onClick={() => changeStatus('PLANNED')}>Valider</Button>}
            {['DRAFT', 'PLANNED'].includes(tour.status) && <Button color="red" variant="outline" leftSection={<IconX size={16}/>} onClick={() => changeStatus('CANCELLED')}>Annuler</Button>}
          </Group>
        </Group>
      </Paper>

      {/* CARTE TEMPS RÉEL */}
      {['PLANNED', 'IN_PROGRESS'].includes(tour.status) && (
          <Paper withBorder p="0" mb="lg" h={300} style={{ overflow: 'hidden', position: 'relative' }}>
              <MapContainer center={truckPosition ? [truckPosition.lat, truckPosition.lng] : [-1.6585, 29.2205]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {tourClients.map((tc: any) => tc.client?.location?.coordinates && <Marker key={tc.clientId} position={[tc.client.location.coordinates[0], tc.client.location.coordinates[1]]} />)}
                {truckPosition && <Marker position={[truckPosition.lat, truckPosition.lng]} icon={truckIcon}><Popup>Camion</Popup></Marker>}
              </MapContainer>
              {!truckPosition && <div style={{ position: 'absolute', top: 10, right: 10, background: 'white', padding: 5, borderRadius: 5, zIndex: 1000 }}><Text size="xs" c="dimmed">En attente signal GPS...</Text></div>}
          </Paper>
      )}

      <Grid>
        {/* COLONNE GAUCHE : Clients Disponibles */}
        <Grid.Col span={6}>
          <Paper withBorder p="md" h="70vh" style={{ display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" mb="md">
                <Title order={4}>Clients Disponibles</Title>
                {isEditable && <Button variant="light" color="violet" size="xs" leftSection={<IconBolt size={14}/>} onClick={handleAutoPlan}>Remplir Auto ⚡</Button>}
            </Group>
            <ScrollArea style={{ flex: 1 }}>
              {availableClients.length === 0 && <Text c="dimmed" size="sm" ta="center">Aucun client disponible.</Text>}
              {availableClients.map(client => (
                <Paper key={client.id} withBorder p="sm" mb="xs" shadow="none" bg={!isEditable ? 'gray.1' : 'white'}>
                  <Group justify="space-between">
                    <div><Text fw={500}>{client.name}</Text><Text size="xs" c="dimmed">{client.street_address}</Text></div>
                    <ActionIcon variant="light" color="blue" onClick={() => handleAddClient(client)} disabled={!isEditable}><IconPlus size={18} /></ActionIcon>
                  </Group>
                </Paper>
              ))}
            </ScrollArea>
          </Paper>
        </Grid.Col>

        {/* COLONNE DROITE : Itinéraire Temps Réel */}
        <Grid.Col span={6}>
          <Paper withBorder p="md" h="70vh" bg="gray.0" style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Header avec Barre de Progression */}
            <Group justify="space-between" mb="xs">
                <Title order={4}>Itinéraire</Title>
                <Badge variant="outline" color={progressPercent === 100 ? 'green' : 'blue'}>{completedStops} / {totalStops}</Badge>
            </Group>
            <Progress value={progressPercent} color="green" size="sm" mb="md" animated={tour.status === 'IN_PROGRESS'} />

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="tour-list" isDropDisabled={!isEditable}> 
                {(provided) => (
                  <ScrollArea style={{ flex: 1 }} {...provided.droppableProps} ref={provided.innerRef}>
                    {tourClients.length === 0 && <Text c="dimmed" ta="center" mt="xl">Tournée vide</Text>}
                    {tourClients.map((tc: any, index: number) => {
                      const isDone = tc.lastStatus === 'COMPLETED';
                      return (
                      <Draggable key={tc.clientId} draggableId={tc.clientId} index={index} isDragDisabled={!isEditable}>
                        {(provided, snapshot) => (
                          <Paper 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            withBorder p="sm" mb="xs" shadow="sm"
                            bg={isDone ? 'green.1' : snapshot.isDragging ? 'blue.0' : 'white'} // COULEUR DYNAMIQUE
                            style={{ ...provided.draggableProps.style, display: 'flex', alignItems: 'center', borderColor: isDone ? '#40c057' : '#dee2e6' }}
                          >
                            {isEditable && !isDone && <div {...provided.dragHandleProps} style={{ cursor: 'grab', marginRight: 10, color: '#aaa' }}><IconGripVertical size={18} /></div>}
                            
                            {/* Numéro ou Check */}
                            {isDone ? 
                                <ThemeIcon color="green" size={24} radius="xl" mr="sm"><IconCheck size={16} /></ThemeIcon> : 
                                <Badge circle size="lg" mr="sm" color="gray">{index + 1}</Badge>
                            }
                            
                            <div style={{ flex: 1 }}>
                              <Text fw={500} td={isDone ? 'line-through' : undefined} c={isDone ? 'dimmed' : undefined}>{tc.client?.name}</Text>
                              <Text size="xs" c="dimmed">{tc.client?.street_address}</Text>
                            </div>

                            {!isDone && <ActionIcon variant="filled" color="red" size="md" onClick={() => handleRemoveClient(tc.clientId)} disabled={!isEditable}><IconTrash size={16} /></ActionIcon>}
                          </Paper>
                        )}
                      </Draggable>
                    )})}
                    {provided.placeholder}
                  </ScrollArea>
                )}
              </Droppable>
            </DragDropContext>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}