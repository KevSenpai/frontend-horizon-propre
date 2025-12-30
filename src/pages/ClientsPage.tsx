import React, { useEffect, useState } from 'react';
import { Table, Title, Container, Badge, Group, Button, Paper, Text, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconUser, IconPencil, IconTrash } from '@tabler/icons-react';
import { api } from '../services/api';
import CreateClientModal from '../components/CreateClientModal';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientToEdit, setClientToEdit] = useState<any | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients');
      setClients(res.data);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleCreate = () => { setClientToEdit(null); open(); };
  const handleEdit = (client: any) => { setClientToEdit(client); open(); };
  const handleDelete = async (id: string) => {
    if(!confirm("Supprimer ce client ?")) return;
    try { await api.delete(`/clients/${id}`); fetchClients(); } catch(e) { alert("Erreur suppression"); }
  };

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
      <Table.Td>
        <Group gap="xs">
            <ActionIcon variant="subtle" color="blue" onClick={() => handleEdit(client)}>
                <IconPencil size={16} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(client.id)}>
                <IconTrash size={16} />
            </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Clients</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={handleCreate}>Nouveau Client</Button>
      </Group>

      <Paper shadow="xs" p="md" withBorder>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nom</Table.Th>
              <Table.Th>Téléphone</Table.Th>
              <Table.Th>Adresse</Table.Th>
              <Table.Th>Jours</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
             {loading ? <Table.Tr><Table.Td colSpan={5} align="center">Chargement...</Table.Td></Table.Tr> : rows}
          </Table.Tbody>
        </Table>
      </Paper>

      <CreateClientModal 
        opened={opened} 
        close={close} 
        onSuccess={fetchClients} 
        clientToEdit={clientToEdit}
      />
    </Container>
  );
}