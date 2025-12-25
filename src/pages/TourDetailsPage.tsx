import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Paper, Title, Text, Button, Group, Badge, ActionIcon, ScrollArea, LoadingOverlay } from '@mantine/core';
import { IconArrowLeft, IconPlus, IconTrash, IconGripVertical, IconCheck, IconX, IconBolt } from '@tabler/icons-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '../services/api';

export default function TourDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [tour, setTour] = useState<any>(null);
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [tourClients, setTourClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper pour savoir si on peut modifier la tournée
  const isEditable = tour?.status === 'DRAFT';

  // 1. Chargement des données
  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // a. Infos tournée
      const tourRes = await api.get(`/tours/${id}`);
      setTour(tourRes.data);

      // b. Clients dans la tournée
      const assignedRes = await api.get(`/tour-clients/tour/${id}`);
      setTourClients(assignedRes.data);

      // c. Clients disponibles (filtrage local)
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

  useEffect(() => { loadData(); }, [id]);

  // 2. Ajouter Client Manuellement
  const handleAddClient = async (client: any) => {
    if (!isEditable) return; 
    try {
      const newPosition = tourClients.length + 1;
      await api.post('/tour-clients', {
        tourId: id,
        clientId: client.id,
        position: newPosition
      });
      loadData();
    } catch (e) { console.error(e); }
  };

  // 3. Retirer Client
  const handleRemoveClient = async (clientId: string) => {
    if (!isEditable) return;
    if(!confirm("Retirer ce client de la tournée ?")) return;
    try {
      await api.delete(`/tour-clients/${id}/${clientId}`);
      loadData();
    } catch (e) { console.error(e); }
  };

  // 4. Drag & Drop (Réorganisation visuelle)
  const onDragEnd = (result: any) => {
    if (!result.destination || !isEditable) return;
    const items = Array.from(tourClients);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setTourClients(items);
    // TODO: Appel API pour sauvegarder le nouvel ordre
  };

  // 5. Changement de Statut (Workflow)
  const changeStatus = async (newStatus: string) => {
    if (newStatus === 'PLANNED' && !confirm("Valider cette tournée ? Elle sera envoyée à l'équipe mobile et ne sera plus modifiable.")) return;
    if (newStatus === 'CANCELLED' && !confirm("Voulez-vous vraiment annuler cette tournée ?")) return;

    try {
      await api.patch(`/tours/${id}`, { status: newStatus });
      loadData(); // Recharger pour voir le nouveau statut
    } catch (e) {
      console.error(e);
      alert("Erreur lors du changement de statut");
    }
  };

  // 6. Auto-Planification ⚡
  const handleAutoPlan = async () => {
    if (!isEditable) return;
    if (!confirm("Attention : L'auto-planification va remplacer la liste actuelle par une suggestion optimisée. Continuer ?")) return;
    
    setLoading(true);
    try {
      const res = await api.post(`/tours/${id}/auto-plan`);
      alert(`Terminé ! ${res.data.count} clients ont été ajoutés à la tournée.`);
      loadData(); 
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la planification automatique.");
    } finally {
      setLoading(false);
    }
  };

  // Couleurs des badges
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
            <Badge size="xl" variant="light" color={getStatusColor(tour.status)}>
                {tour.status}
            </Badge>

            {/* Boutons d'action conditionnels */}
            {tour.status === 'DRAFT' && (
                <Button color="green" leftSection={<IconCheck size={16}/>} onClick={() => changeStatus('PLANNED')}>
                    Valider / Planifier
                </Button>
            )}
            
            {['DRAFT', 'PLANNED'].includes(tour.status) && (
                <Button color="red" variant="outline" leftSection={<IconX size={16}/>} onClick={() => changeStatus('CANCELLED')}>
                    Annuler
                </Button>
            )}
          </Group>
        </Group>
      </Paper>

      <Grid>
        {/* COLONNE GAUCHE : Clients Disponibles */}
        <Grid.Col span={6}>
          <Paper withBorder p="md" h="70vh" style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Header Colonne Gauche avec Bouton Auto */}
            <Group justify="space-between" mb="md">
                <Title order={4}>Clients Disponibles</Title>
                {isEditable && (
                    <Button 
                        variant="light" 
                        color="violet" 
                        size="xs" 
                        leftSection={<IconBolt size={14}/>}
                        onClick={handleAutoPlan}
                        loading={loading}
                    >
                        Remplir Auto ⚡
                    </Button>
                )}
            </Group>
            
            <ScrollArea style={{ flex: 1 }}>
              {availableClients.length === 0 && <Text c="dimmed" size="sm" align="center">Aucun client disponible.</Text>}
              
              {availableClients.map(client => (
                <Paper key={client.id} withBorder p="sm" mb="xs" shadow="none" bg={!isEditable ? 'gray.1' : 'white'}>
                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>{client.name}</Text>
                      <Text size="xs" c="dimmed">{client.street_address}, {client.district}</Text>
                    </div>
                    <ActionIcon 
                        variant="light" 
                        color="blue" 
                        onClick={() => handleAddClient(client)}
                        disabled={!isEditable}
                    >
                      <IconPlus size={18} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}
            </ScrollArea>
          </Paper>
        </Grid.Col>

        {/* COLONNE DROITE : Tournée en cours (Drag & Drop) */}
        <Grid.Col span={6}>
          <Paper withBorder p="md" h="70vh" bg="gray.0" style={{ display: 'flex', flexDirection: 'column' }}>
            <Title order={4} mb="md">Itinéraire ({tourClients.length} arrêts)</Title>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="tour-list" isDropDisabled={!isEditable}> 
                {(provided) => (
                  <ScrollArea style={{ flex: 1 }} {...provided.droppableProps} ref={provided.innerRef}>
                    
                    {tourClients.length === 0 && <Text c="dimmed" align="center" mt="xl">Tournée vide</Text>}

                    {tourClients.map((tc: any, index: number) => (
                      <Draggable key={tc.clientId} draggableId={tc.clientId} index={index} isDragDisabled={!isEditable}>
                        {(provided, snapshot) => (
                          <Paper 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            withBorder p="sm" mb="xs" shadow="sm"
                            bg={snapshot.isDragging ? 'blue.0' : 'white'}
                            style={{ ...provided.draggableProps.style, display: 'flex', alignItems: 'center' }}
                          >
                            {/* Poignée pour attraper/glisser */}
                            {isEditable && (
                                <div {...provided.dragHandleProps} style={{ cursor: 'grab', marginRight: 10, color: '#aaa' }}>
                                    <IconGripVertical size={18} />
                                </div>
                            )}

                            <Badge circle size="lg" mr="sm" color="gray">{index + 1}</Badge>
                            
                            <div style={{ flex: 1 }}>
                              <Text fw={500}>{tc.client?.name}</Text>
                              <Text size="xs" c="dimmed">{tc.client?.street_address}</Text>
                            </div>

                            {/* BOUTON DE RETRAIT */}
                            <ActionIcon 
                                variant="filled" 
                                color="red" 
                                size="md"
                                onClick={() => handleRemoveClient(tc.clientId)}
                                title="Retirer"
                                disabled={!isEditable}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Paper>
                        )}
                      </Draggable>
                    ))}
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