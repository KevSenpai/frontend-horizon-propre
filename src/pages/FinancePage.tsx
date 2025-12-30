import React, { useEffect, useState } from 'react';
import { Container, Title, Paper, Table, Badge, Group, Button, Text, LoadingOverlay } from '@mantine/core';
import { IconPlus, IconCurrencyDollar } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { api } from '../services/api';
import CreateInvoiceModal from '../components/CreateInvoiceModal';

export default function FinancePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      console.log("Réponse API Factures:", res.data); // Pour le debug

      // CORRECTION : On vérifie si c'est bien un tableau avant de trier
      if (Array.isArray(res.data)) {
        const sorted = res.data.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setInvoices(sorted);
      } else {
        console.error("Format de réponse inattendu (pas un tableau):", res.data);
        setInvoices([]); // On met une liste vide par sécurité
      }

    } catch (error) {
      console.error("Erreur chargement factures", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'green';
      case 'PENDING': return 'yellow';
      case 'OVERDUE': return 'red';
      case 'CANCELLED': return 'gray';
      default: return 'blue';
    }
  };

  const rows = invoices.map((inv) => (
    <Table.Tr key={inv.id}>
      <Table.Td>
        <Text fw={500}>{inv.client?.name || 'Client inconnu'}</Text>
        <Text size="xs" c="dimmed">{inv.period}</Text>
      </Table.Td>
      <Table.Td fw={700}>{inv.amount} $</Table.Td>
      <Table.Td>{inv.due_date}</Table.Td>
      <Table.Td>
        <Badge color={getStatusColor(inv.status)} variant="light">
          {inv.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        {inv.status === 'PENDING' && (
            <Button size="xs" variant="subtle" color="green">Encaisser</Button>
        )}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Finance & Facturation</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={open}>
          Nouvelle Facture
        </Button>
      </Group>

      <Paper shadow="xs" p="md" withBorder style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible={loading} />
        
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Client / Période</Table.Th>
              <Table.Th>Montant</Table.Th>
              <Table.Th>Échéance</Table.Th>
              <Table.Th>Statut</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows}
            {!loading && invoices.length === 0 && (
                 <Table.Tr><Table.Td colSpan={5} align="center">
                    <Text c="dimmed" py="xl">Aucune facture émise.</Text>
                 </Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <CreateInvoiceModal opened={opened} close={close} onSuccess={fetchInvoices} />
    </Container>
  );
}