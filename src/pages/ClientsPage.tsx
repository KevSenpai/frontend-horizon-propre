import React, { useEffect, useState } from 'react';
import { Table, Title, Container, Badge, Group, Button, Paper, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconUser } from '@tabler/icons-react';
import { api } from '../services/api';
import CreateClientModal from '../components/CreateClientModal';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchClients = async () => {
    const res = await api.get('/clients');
    setClients(res.data);
  };

  useEffect(() => { fetchClients(); }, []);

  const rows = clients.map((client) => (
    <Table.Tr key={client.id}>
      <Table.Td>{client.name}</Table.Td>
      <Table.Td>{client.phone_number}</Table.Td>
      <Table.Td>{client.district} - {client.street_address}</Table.Td>
      <Table.Td>
        {client.collection_days.map((day: string) => (
          <Badge key={day} size="xs" mr={3}>{day.substring(0, 3)}</Badge>
        ))}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Clients</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={open}>Nouveau Client</Button>
      </Group>

      <Paper shadow="xs" p="md" withBorder>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nom</Table.Th>
              <Table.Th>Téléphone</Table.Th>
              <Table.Th>Adresse</Table.Th>
              <Table.Th>Jours</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Paper>

      <CreateClientModal opened={opened} close={close} onSuccess={fetchClients} />
    </Container>
  );
}