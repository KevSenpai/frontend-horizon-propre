import React, { useEffect, useState } from 'react';
import { Table, Title, Container, Badge, Group, Button, Paper, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom'; // <--- 1. IMPORT IMPORTANT
import { api } from '../services/api';
import CreateTourModal from '../components/CreateTourModal';

export default function ToursPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const navigate = useNavigate(); // <--- 2. INITIALISATION DE LA NAVIGATION

  const fetchTours = async () => {
    try {
      const res = await api.get('/tours');
      // Tri par date décroissante (le plus récent en haut)
      const sortedTours = res.data.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTours(sortedTours);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchTours(); }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'gray';
      case 'PLANNED': return 'blue';
      case 'IN_PROGRESS': return 'orange';
      case 'COMPLETED': return 'green';
      default: return 'gray';
    }
  };

  const rows = tours.map((tour) => (
    <Table.Tr key={tour.id}>
      <Table.Td>
        <Text fw={500}>{tour.name}</Text>
        <Text size="xs" c="dimmed">{tour.system_id}</Text>
      </Table.Td>
      <Table.Td>{tour.tour_date}</Table.Td>
      <Table.Td>{tour.team?.name || '?'}</Table.Td>
      <Table.Td>{tour.vehicle?.name || '?'}</Table.Td>
      <Table.Td>
        <Badge color={getStatusColor(tour.status)}>{tour.status}</Badge>
      </Table.Td>
      <Table.Td>
        {/* 3. LE BOUTON BRANCHÉ */}
        <Button 
          size="xs" 
          variant="light" 
          onClick={() => navigate(`/planning/${tour.id}`)}
        >
          Détails
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Planification</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={open}>Nouvelle Tournée</Button>
      </Group>

      <Paper shadow="xs" p="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nom</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Équipe</Table.Th>
              <Table.Th>Véhicule</Table.Th>
              <Table.Th>Statut</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
        {tours.length === 0 && <Text ta="center" py="xl" c="dimmed">Aucune tournée planifiée.</Text>}
      </Paper>

      <CreateTourModal opened={opened} close={close} onSuccess={fetchTours} />
    </Container>
  );
}