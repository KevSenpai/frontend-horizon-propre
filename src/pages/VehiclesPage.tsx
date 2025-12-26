import React, { useEffect, useState } from 'react';
import { Table, Title, Container, Badge, Group, Button, Paper, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTruck } from '@tabler/icons-react';
import { api } from '../services/api';
import CreateVehicleModal from '../components/CreateVehicleModal';

interface Vehicle {
  id: string;
  name: string;
  license_plate: string;
  status: 'OPERATIONAL' | 'MAINTENANCE';
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const rows = vehicles.map((vehicle) => (
    <Table.Tr key={vehicle.id}>
      <Table.Td>
        <Group gap="sm">
          <IconTruck size={16} color="gray" />
          <Text fw={500}>{vehicle.name}</Text>
        </Group>
      </Table.Td>
      <Table.Td>{vehicle.license_plate}</Table.Td>
      <Table.Td>
        <Badge 
          color={vehicle.status === 'OPERATIONAL' ? 'blue' : 'orange'} 
          variant="light"
        >
          {vehicle.status}
        </Badge>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Véhicules</Title>
          <Text c="dimmed">Gérez la flotte de camions</Text>
        </div>
        <Button leftSection={<IconPlus size={14} />} onClick={open}>
          Nouveau Véhicule
        </Button>
      </Group>

      <Paper shadow="xs" radius="md" withBorder>
        <Table verticalSpacing="sm" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nom / Modèle</Table.Th>
              <Table.Th>Immatriculation</Table.Th>
              <Table.Th>Statut</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr><Table.Td colSpan={3} align="center">Chargement...</Table.Td></Table.Tr>
            ) : rows}
          </Table.Tbody>
        </Table>
        
        {!loading && vehicles.length === 0 && (
          <Text ta="center" py="xl" c="dimmed">Aucun véhicule trouvé.</Text>
        )}
      </Paper>

      <CreateVehicleModal opened={opened} close={close} onSuccess={fetchVehicles} />
    </Container>
  );
}