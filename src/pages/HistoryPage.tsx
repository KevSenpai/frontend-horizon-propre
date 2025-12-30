import React, { useEffect, useState } from 'react';
import { Container, Title, Paper, Table, Badge, Text, Group, LoadingOverlay } from '@mantine/core';
import { IconCheck, IconX, IconCalendarTime } from '@tabler/icons-react';
import { api } from '../services/api';

export default function HistoryPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger l'historique depuis le nouveau endpoint Backend
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/collections');
        setCollections(res.data);
      } catch (error) {
        console.error("Erreur chargement historique", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const rows = collections.map((col) => {
    const isDone = col.status === 'COMPLETED';
    const date = new Date(col.collected_at);

    return (
      <Table.Tr key={col.id}>
        <Table.Td>
          <Group gap="xs">
            <IconCalendarTime size={16} color="gray" />
            <div>
                <Text size="sm" fw={500}>{date.toLocaleDateString()}</Text>
                <Text size="xs" c="dimmed">{date.toLocaleTimeString()}</Text>
            </div>
          </Group>
        </Table.Td>
        <Table.Td>
            <Text fw={500}>{col.client?.name || 'Client Inconnu'}</Text>
            <Text size="xs" c="dimmed">{col.client?.district}</Text>
        </Table.Td>
        <Table.Td>{col.tour?.name || 'Tournée supprimée'}</Table.Td>
        <Table.Td>{col.tour?.team?.name || '-'}</Table.Td>
        <Table.Td>
          <Badge 
            color={isDone ? 'green' : 'red'} 
            leftSection={isDone ? <IconCheck size={12}/> : <IconX size={12}/>}
          >
            {isDone ? 'COLLECTÉ' : 'ÉCHEC'}
          </Badge>
          {!isDone && col.reason_if_failed && (
            <Text size="xs" c="red" mt={4}>Motif : {col.reason_if_failed}</Text>
          )}
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="lg">Historique des Collectes</Title>
      
      <Paper shadow="xs" p="md" withBorder style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible={loading} />
        
        <Table striped highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date & Heure</Table.Th>
              <Table.Th>Client</Table.Th>
              <Table.Th>Tournée</Table.Th>
              <Table.Th>Équipe</Table.Th>
              <Table.Th>Statut</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows}
            {!loading && collections.length === 0 && (
                <Table.Tr>
                    <Table.Td colSpan={5} align="center">
                        <Text c="dimmed" py="xl">Aucun historique disponible.</Text>
                    </Table.Td>
                </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Container>
  );
}