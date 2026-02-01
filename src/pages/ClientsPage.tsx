import React, { useEffect, useState } from 'react';
import { Table, Title, Container, Badge, Group, Button, Paper, TextInput, ActionIcon, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconSearch, IconPencil, IconTrash } from '@tabler/icons-react';
import { api } from '../services/api';
import CreateClientModal from '../components/CreateClientModal';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  // --- FILTRAGE DYNAMIQUE ---
  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    return (
        client.name.toLowerCase().includes(query) || 
        client.phone_number.includes(query) ||
        (client.district && client.district.toLowerCase().includes(query))
    );
  });

  // --- GÉNÉRATION DES LIGNES (CORRIGÉ) ---
  const rows = filteredClients.map((client) => (
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
            <ActionIcon variant="subtle" color="blue" onClick={() => handleEdit(client)}><IconPencil size={16} /></ActionIcon>
            <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(client.id)}><IconTrash size={16} /></ActionIcon>
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
        {/* BARRE DE RECHERCHE */}
        <TextInput 
            placeholder="Rechercher par nom, téléphone ou quartier..." 
            mb="md"
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />

        <Table striped highlightOnHover>
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
             {loading ? (
                <Table.Tr><Table.Td colSpan={5} align="center">Chargement...</Table.Td></Table.Tr> 
             ) : rows}
             
             {!loading && filteredClients.length === 0 && (
                 <Table.Tr><Table.Td colSpan={5} align="center"><Text c="dimmed">Aucun client trouvé.</Text></Table.Td></Table.Tr>
             )}
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