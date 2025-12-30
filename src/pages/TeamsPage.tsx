import React, { useEffect, useState } from 'react';
import { Table, Title, Container, Badge, Group, Button, Paper, Text, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconUsers, IconPencil, IconTrash } from '@tabler/icons-react';
import { api } from '../services/api';
import CreateTeamModal from '../components/CreateTeamModal';

interface Team {
  id: string;
  name: string;
  members_info: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  
  // État pour stocker l'équipe en cours d'édition
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await api.get('/teams');
      setTeams(response.data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  // Ouvrir la modale en mode Création
  const handleCreate = () => {
    setTeamToEdit(null);
    open();
  };

  // Ouvrir la modale en mode Édition
  const handleEdit = (team: Team) => {
    setTeamToEdit(team);
    open();
  };

  // Supprimer
  const handleDelete = async (id: string) => {
    if(!confirm("Supprimer cette équipe ?")) return;
    try {
      await api.delete(`/teams/${id}`);
      fetchTeams();
    } catch (e) { alert("Erreur suppression"); }
  };

  const rows = teams.map((team) => (
    <Table.Tr key={team.id}>
      <Table.Td>
        <Group gap="sm">
          <IconUsers size={16} color="gray" />
          <Text fw={500}>{team.name}</Text>
        </Group>
      </Table.Td>
      <Table.Td>{team.members_info}</Table.Td>
      <Table.Td>
        <Badge color={team.status === 'ACTIVE' ? 'green' : 'gray'} variant="light">
          {team.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
            <ActionIcon variant="subtle" color="blue" onClick={() => handleEdit(team)}>
                <IconPencil size={16} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(team.id)}>
                <IconTrash size={16} />
            </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Équipes</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={handleCreate}>
          Nouvelle Équipe
        </Button>
      </Group>

      <Paper shadow="xs" radius="md" withBorder>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nom</Table.Th>
              <Table.Th>Membres</Table.Th>
              <Table.Th>Statut</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows}
          </Table.Tbody>
        </Table>
      </Paper>

      <CreateTeamModal 
        opened={opened} 
        close={close} 
        onSuccess={fetchTeams} 
        teamToEdit={teamToEdit} 
      />
    </Container>
  );
}