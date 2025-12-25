import React from 'react';
import { useEffect, useState } from 'react';
import { Table, Title, Container, Badge, Group, Button, Paper, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks'; // <--- Nouveau hook
import { IconPlus, IconUsers } from '@tabler/icons-react';
import { api } from '../services/api';
import CreateTeamModal from '../components/CreateTeamModal'; // <--- Import du composant

interface Team {
  id: string;
  name: string;
  members_info: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Gestion de l'ouverture/fermeture de la modale
  const [opened, { open, close }] = useDisclosure(false);

  const fetchTeams = async () => {
    setLoading(true); // Petit UX : on remet loading quand on rafraichit
    try {
      const response = await api.get('/teams');
      // On trie pour avoir les plus récents en premier (optionnel mais sympa)
      const sortedTeams = response.data.sort((a: Team, b: Team) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setTeams(sortedTeams);
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

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
    </Table.Tr>
  ));

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Équipes</Title>
          <Text c="dimmed">Gérez les équipes de collecte sur le terrain</Text>
        </div>
        {/* Le bouton déclenche l'ouverture de la modale */}
        <Button leftSection={<IconPlus size={14} />} onClick={open}>
          Nouvelle Équipe
        </Button>
      </Group>

      <Paper shadow="xs" radius="md" withBorder>
        <Table verticalSpacing="sm" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nom de l'équipe</Table.Th>
              <Table.Th>Membres</Table.Th>
              <Table.Th>Statut</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr><Table.Td colSpan={3} align="center">Chargement...</Table.Td></Table.Tr>
            ) : rows}
          </Table.Tbody>
        </Table>
        
        {!loading && teams.length === 0 && (
          <Text align="center" py="xl" c="dimmed">Aucune équipe trouvée.</Text>
        )}
      </Paper>

      {/* Intégration de la Modale */}
      <CreateTeamModal 
        opened={opened} 
        close={close} 
        onSuccess={fetchTeams} // On recharge la liste après succès
      />
    </Container>
  );
}