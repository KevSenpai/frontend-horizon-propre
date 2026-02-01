import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Paper, Title, Text, Button, Group, Badge, ActionIcon, ScrollArea, LoadingOverlay, ThemeIcon, Progress } from '@mantine/core';
import { IconArrowLeft, IconPlus, IconTrash, IconGripVertical, IconCheck, IconX, IconBolt, IconPrinter } from '@tabler/icons-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

// --- ICÔNES ---
const truckIcon = L.divIcon({
  html: '<div style="font-size: 24px;">🚚</div>',
  className: 'truck-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const greenIcon = L.divIcon({
  html: '<div style="background-color: #40c057; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 3px black;"></div>',
  className: 'custom-green-icon',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const createNumberedIcon = (number: number) => L.divIcon({
  html: `<div style="background-color: #228be6; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 0 3px black;">${number}</div>`,
  className: 'custom-num-icon',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});
// --------------

export default function TourDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [tour, setTour] = useState<any>(null);
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [tourClients, setTourClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [truckPosition, setTruckPosition] = useState<{lat: number, lng: number} | null>(null);

  const isEditable = tour?.status === 'DRAFT';

  const totalStops = tourClients.length;
  const completedStops = tourClients.filter((tc: any) => tc.lastStatus === 'COMPLETED').length;
  const progressPercent = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const tourRes = await api.get(`/tours/${id}`);
      setTour(tourRes.data);

      const assignedRes = await api.get(`/tour-clients/tour/${id}`);
      setTourClients(assignedRes.data);

      // Récupération des clients disponibles selon la date de la tournée
      if (tourRes.data.tour_date) {
          const allClientsRes = await api.get(`/clients/available?date=${tourRes.data.tour_date}`);
          // On filtre ceux qui sont déjà dans CETTE tournée (le backend filtre déjà les autres tournées)
          const assignedIds = new Set(assignedRes.data.map((tc: any) => tc.clientId));
          const available = allClientsRes.data.filter((c: any) => !assignedIds.has(c.id));
          setAvailableClients(available);
      }
    } catch (error) {
      console.error("Erreur chargement", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const socket = connectSocket();
    socket.on(`trackTour:${id}`, (data: { lat: number, lng: number }) => {
        setTruckPosition({ lat: data.lat, lng: data.lng });
    });
    socket.on(`tourProgress:${id}`, (payload: { clientId: string, status: string }) => {
        setTourClients(currentList => currentList.map(item => {
            if (item.clientId === payload.clientId) {
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
    if(!confirm("Retirer ce client ?")) return;
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
    if (!isEditable || !confirm("Remplacer par auto-planification ?")) return;
    setLoading(true);
    try {
      const res = await api.post(`/tours/${id}/auto-plan`);
      alert(`Ajoutés : ${res.data.count}`);
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
      default: return 'red';
    }
  };

  if (!tour) return <div>Chargement...</div>;

  return (
    <Container size="xl" py="xl">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      
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
            <Button variant="default" leftSection={<IconPrinter size={16}/>} onClick={handleDownloadPdf}>PDF</Button>
            <Badge size="xl" variant="light" color={getStatusColor(tour.status)}>{tour.status}</Badge>
            {tour.status === 'DRAFT' && <Button color="green" leftSection={<IconCheck size={16}/>} onClick={() => changeStatus('PLANNED')}>Valider</Button>}
            {['DRAFT', 'PLANNED'].includes(tour.status) && <Button color="red" variant="outline" leftSection={<IconX size={16}/>} onClick={() => changeStatus('CANCELLED')}>Annuler</Button>}
          </Group>
        </Group>
      </Paper>

      {/* CARTE DE PLANIFICATION (Visible même en DRAFT maintenant) */}
      <Paper withBorder p="0" mb="lg" h={400} style={{ overflow: 'hidden', position: 'relative' }}>
          <MapContainer center={[-1.6585, 29.2205]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* 1. MARQUEURS BLEUS (Clients dans la tournée) */}
            {tourClients.map((tc: any, index: number) => {
                const coords = tc.client?.location?.coordinates;
                if(coords) {
                    // Attention: PostGIS = [Lon, Lat] -> Leaflet = [Lat, Lon]
                    // Adaptez l'ordre selon ce que vous voyez sur la carte (si c'est dans l'océan, inversez)
                    return <Marker key={tc.clientId} position={[coords[1], coords[0]]} icon={createNumberedIcon(index+1)}><Popup><b>{index+1}. {tc.client.name}</b></Popup></Marker>
                }
                return null;
            })}

            {/* 2. MARQUEURS VERTS (Clients disponibles) - Uniquement en DRAFT */}
            {isEditable && availableClients.map((client: any) => {
                const coords = client.location?.coordinates;
                if(coords) {
                    return (
                        <Marker key={client.id} position={[coords[1], coords[0]]} icon={greenIcon}>
                            <Popup>
                                <div style={{textAlign: 'center'}}>
                                    <b>{client.name}</b><br/>
                                    <Button size="compact-xs" mt={5} onClick={() => handleAddClient(client)}>Ajouter +</Button>
                                </div>
                            </Popup>
                        </Marker>
                    )
                }
                return null;
            })}

            {/* 3. CAMION (Si actif) */}
            {truckPosition && <Marker position={[truckPosition.lat, truckPosition.lng]} icon={truckIcon}><Popup>Camion</Popup></Marker>}
          </MapContainer>
      </Paper>

      <Grid>
        <Grid.Col span={6}>
          <Paper withBorder p="md" h="60vh" style={{ display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" mb="md">
                <Title order={4}>Disponibles ({availableClients.length})</Title>
                {isEditable && <Button variant="light" color="violet" size="xs" leftSection={<IconBolt size={14}/>} onClick={handleAutoPlan}>Auto ⚡</Button>}
            </Group>
            <ScrollArea style={{ flex: 1 }}>
              {availableClients.map(client => (
                <Paper key={client.id} withBorder p="xs" mb="xs" bg={!isEditable ? 'gray.1' : 'white'}>
                  <Group justify="space-between">
                    <div><Text fw={500} size="sm">{client.name}</Text><Text size="xs" c="dimmed">{client.street_address}</Text></div>
                    <ActionIcon variant="light" color="blue" onClick={() => handleAddClient(client)} disabled={!isEditable}><IconPlus size={16} /></ActionIcon>
                  </Group>
                </Paper>
              ))}
            </ScrollArea>
          </Paper>
        </Grid.Col>

        <Grid.Col span={6}>
          <Paper withBorder p="md" h="60vh" bg="gray.0" style={{ display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" mb="xs">
                <Title order={4}>Ordre de passage</Title>
                <Badge variant="outline">{completedStops} / {totalStops}</Badge>
            </Group>
            <Progress value={progressPercent} color="green" size="sm" mb="md" animated={tour.status === 'IN_PROGRESS'} />

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="tour-list" isDropDisabled={!isEditable}> 
                {(provided) => (
                  <ScrollArea style={{ flex: 1 }} {...provided.droppableProps} ref={provided.innerRef}>
                    {tourClients.map((tc: any, index: number) => {
                      const isDone = tc.lastStatus === 'COMPLETED';
                      return (
                      <Draggable key={tc.clientId} draggableId={tc.clientId} index={index} isDragDisabled={!isEditable}>
                        {(provided, snapshot) => (
                          <Paper 
                            ref={provided.innerRef} {...provided.draggableProps} withBorder p="xs" mb="xs" shadow="sm"
                            bg={isDone ? 'green.1' : snapshot.isDragging ? 'blue.0' : 'white'}
                            style={{ ...provided.draggableProps.style, display: 'flex', alignItems: 'center' }}
                          >
                            {isEditable && !isDone && <div {...provided.dragHandleProps} style={{ cursor: 'grab', marginRight: 10 }}><IconGripVertical size={16} /></div>}
                            {isDone ? <ThemeIcon color="green" size={20} radius="xl" mr="sm"><IconCheck size={12} /></ThemeIcon> : <Badge circle size="md" mr="sm" color="gray">{index + 1}</Badge>}
                            <div style={{ flex: 1 }}>
                              <Text fw={500} size="sm" td={isDone ? 'line-through' : undefined}>{tc.client?.name}</Text>
                              <Text size="xs" c="dimmed">{tc.client?.street_address}</Text>
                            </div>
                            {!isDone && <ActionIcon variant="filled" color="red" size="sm" onClick={() => handleRemoveClient(tc.clientId)} disabled={!isEditable}><IconTrash size={14} /></ActionIcon>}
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