import React, { useEffect, useState } from 'react';
import { Container, Title, Paper, Table, Badge, Group, Button, Text, LoadingOverlay, Select, Tabs } from '@mantine/core';
import { IconPlus, IconList, IconChartBar, IconCheck } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { api } from '../services/api';
import CreateInvoiceModal from '../components/CreateInvoiceModal';
import RevenueChart from '../components/RevenueChart'; // <--- Import du nouveau composant

export default function FinancePage() {
  // États Factures
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>('ALL');
  
  // États Statistiques
  const [stats, setStats] = useState<{monthly: any[], totalAllTime: number} | null>(null);

  const [opened, { open, close }] = useDisclosure(false);

  // Charger les données
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Charger les factures
      const resInv = await api.get('/invoices');
      if (Array.isArray(resInv.data)) {
        const sorted = resInv.data.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setInvoices(sorted);
      }

      // 2. Charger les stats (Nouveau endpoint)
      const resStats = await api.get('/payments/stats/monthly');
      setStats(resStats.data);

    } catch (error) {
      console.error("Erreur chargement finance", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIQUE FACTURES (Inchangée) ---
  const handleMarkPaid = async (invoice: any) => {
    if(!confirm(`Encaisser ${invoice.amount}$ ?`)) return;
    try {
        await api.post('/payments', { invoice_id: invoice.id, amount: Number(invoice.amount), method: 'CASH' });
        await api.patch(`/invoices/${invoice.id}`, { status: 'PAID' });
        fetchData(); // On recharge tout (y compris les stats qui vont augmenter !)
    } catch (e) { alert("Erreur"); }
  };
  // -----------------------------------

  // Filtrage
  const filteredInvoices = invoices.filter(inv => filter === 'ALL' || inv.status === filter);

  // Rendu du tableau (inchangé)
  const rows = filteredInvoices.map((inv) => (
    <Table.Tr key={inv.id} bg={inv.status === 'OVERDUE' ? 'red.0' : undefined}>
      <Table.Td>
        <Text fw={500}>{inv.client?.name || 'Inconnu'}</Text>
        <Text size="xs" c="dimmed">{inv.period}</Text>
      </Table.Td>
      <Table.Td fw={700}>{inv.amount} $</Table.Td>
      <Table.Td>{inv.due_date}</Table.Td>
      <Table.Td>
        <Badge color={inv.status === 'PAID' ? 'green' : inv.status === 'PENDING' ? 'yellow' : 'red'}>
          {inv.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        {inv.status === 'PENDING' && <Button size="xs" color="green" onClick={() => handleMarkPaid(inv)}><IconCheck size={14}/></Button>}
        {inv.status === 'PAID' && <Text size="sm" c="dimmed">Payé</Text>}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Finance & Revenus</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={open}>Nouvelle Facture</Button>
      </Group>

      <Tabs defaultValue="invoices" keepMounted={false}>
        <Tabs.List mb="md">
          <Tabs.Tab value="invoices" leftSection={<IconList size={14}/>}>Gestion des Factures</Tabs.Tab>
          <Tabs.Tab value="reports" leftSection={<IconChartBar size={14}/>}>Rapports & Revenus</Tabs.Tab>
        </Tabs.List>

        {/* ONGLET 1 : FACTURES */}
        <Tabs.Panel value="invoices">
            <Paper shadow="xs" p="md" withBorder style={{ minHeight: 200, position: 'relative' }}>
                <LoadingOverlay visible={loading} />
                <Group mb="md">
                    <Text fw={500}>Filtre :</Text>
                    <Select data={['ALL', 'PENDING', 'PAID', 'OVERDUE']} value={filter} onChange={setFilter} allowDeselect={false} />
                </Group>
                <Table striped highlightOnHover>
                <Table.Thead>
                    <Table.Tr><Table.Th>Client</Table.Th><Table.Th>Montant</Table.Th><Table.Th>Échéance</Table.Th><Table.Th>Statut</Table.Th><Table.Th>Action</Table.Th></Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Paper>
        </Tabs.Panel>

        {/* ONGLET 2 : STATISTIQUES (NOUVEAU) */}
        <Tabs.Panel value="reports">
            {stats && <RevenueChart data={stats.monthly} totalAllTime={stats.totalAllTime} />}
            
            <Title order={4} mt="xl" mb="md">Détail Mensuel</Title>
            <Paper withBorder>
                <Table>
                    <Table.Thead><Table.Tr><Table.Th>Mois</Table.Th><Table.Th>Revenu Total</Table.Th></Table.Tr></Table.Thead>
                    <Table.Tbody>
                        {stats?.monthly.map((m: any) => (
                            <Table.Tr key={m.month}>
                                <Table.Td fw={700}>{m.month}</Table.Td>
                                <Table.Td>{m.total} $</Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Paper>
        </Tabs.Panel>
      </Tabs>

      <CreateInvoiceModal opened={opened} close={close} onSuccess={fetchData} />
    </Container>
  );
}