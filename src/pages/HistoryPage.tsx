import React, { useEffect, useState } from 'react';
import { Container, Title, Paper, Table, Badge, Text, Group, LoadingOverlay, Button } from '@mantine/core';
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

  // 1. Ajouter cette fonction
const downloadCSV = () => {
    if (collections.length === 0) return;

    // Création de l'en-tête
    const headers = ["Date", "Heure", "Client", "Tournée", "Équipe", "Statut", "Motif"];
    
    // Transformation des données
    const csvContent = [
        headers.join(","),
        ...collections.map(col => {
            const date = new Date(col.collected_at);
            return [
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                `"${col.client?.name || 'Inconnu'}"`,
                `"${col.tour?.name || '-'}"`,
                `"${col.tour?.team?.name || '-'}"`,
                col.status,
                `"${col.reason_if_failed || ''}"`
            ].join(",");
        })
    ].join("\n");

    // Téléchargement
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `historique_collectes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

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
          // ...
         <Badge 
            color={
                col.status === 'COMPLETED' ? 'green' : 
                col.status === 'MISSED' ? 'gray' : 'red' // Gris pour Missed, Rouge pour Failed
            } 
            >
            {col.status === 'COMPLETED' ? 'COLLECTÉ' : col.status === 'MISSED' ? 'NON COLLECTÉ' : 'ÉCHEC'}
          </Badge>
// ...
          {!isDone && col.reason_if_failed && (
            <Text size="xs" c="red" mt={4}>Motif : {col.reason_if_failed}</Text>
          )}
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Container size="xl" py="xl">
    <Group justify="space-between" mb="lg">
     <Title order={2}>Historique des Collectes</Title>
     <Button variant="outline" onClick={downloadCSV}>📄 Exporter CSV</Button>
    </Group>
      
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