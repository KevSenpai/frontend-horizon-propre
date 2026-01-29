import React, { useEffect, useState } from 'react';
import { Container, Title, Paper, Table, Badge, Group, Button, Text, LoadingOverlay, Select, Tabs, TextInput } from '@mantine/core';
import { IconPlus, IconList, IconChartBar, IconCheck, IconSearch } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { api } from '../services/api';
import CreateInvoiceModal from '../components/CreateInvoiceModal';
import RevenueChart from '../components/RevenueChart';

export default function FinancePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState<string | null>('ALL');
  const [searchQuery, setSearchQuery] = useState(''); // <--- NOUVEAU

  const [stats, setStats] = useState<{monthly: any[], totalAllTime: number} | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('invoices');
  const [opened, { open, close }] = useDisclosure(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resInv = await api.get('/invoices');
      if (Array.isArray(resInv.data)) {
        const sorted = resInv.data.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setInvoices(sorted);
      }
      const resStats = await api.get('/payments/stats/monthly');
      setStats(resStats.data);
    } catch (error) {
      console.error("Erreur chargement finance", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleGenerateMonthly = async () => {
    if (!confirm("Générer automatiquement les factures pour tous les clients actifs ce mois-ci ?")) return;
    setLoading(true);
    try {
      const res = await api.post('/invoices/generate-monthly');
      alert(`${res.data.created} factures générées !`);
      fetchData();
    } catch (e) { alert("Erreur génération"); } finally { setLoading(false); }
  };

  const handleMarkPaid = async (invoice: any) => {
    if(!confirm(`Encaisser ${invoice.amount}$ ?`)) return;
    try {
        await api.post('/payments', { invoice_id: invoice.id, amount: Number(invoice.amount), method: 'CASH' });
        await api.patch(`/invoices/${invoice.id}`, { status: 'PAID' });
        fetchData();
    } catch (e) { alert("Erreur"); }
  };

  // --- LOGIQUE DE FILTRAGE COMBINÉE ---
  const filteredInvoices = invoices.filter(inv => {
      // 1. Filtre par statut
      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      
      // 2. Filtre par nom client (Recherche)
      const clientName = inv.client?.name?.toLowerCase() || '';
      const matchSearch = clientName.includes(searchQuery.toLowerCase());

      return matchStatus && matchSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'green';
      case 'PENDING': return 'yellow';
      case 'OVERDUE': return 'red';
      default: return 'gray';
    }
  };

  const rows = filteredInvoices.map((inv) => (
    <Table.Tr key={inv.id} bg={inv.status === 'OVERDUE' ? 'red.0' : undefined}>
      <Table.Td>
        <Text fw={500}>{inv.client?.name || 'Inconnu'}</Text>
        <Text size="xs" c="dimmed">{inv.client?.district}</Text>
      </Table.Td>
      <Table.Td>{inv.period}</Table.Td>
      <Table.Td fw={700}>{inv.amount} $</Table.Td>
      <Table.Td>{inv.due_date}</Table.Td>
      <Table.Td>
        <Badge color={getStatusColor(inv.status)} variant="filled">
          {inv.status === 'PAID' ? 'EN RÈGLE' : inv.status === 'PENDING' ? 'À PAYER' : 'RETARD'}
        </Badge>
      </Table.Td>
      <Table.Td>
        {/* --- CORRECTION ICI : ON ACCEPTE PENDING OU OVERDUE --- */}
        {(inv.status === 'PENDING' || inv.status === 'OVERDUE') && (
            <Button 
                size="xs" 
                color="green" 
                leftSection={<IconCheck size={14}/>} 
                onClick={() => handleMarkPaid(inv)}
            >
                Encaisser
            </Button>
        )}
        
        {inv.status === 'PAID' && <Text size="sm" c="dimmed">Payé</Text>}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Finance</Title>
        <Group>
            <Button variant="light" color="violet" onClick={handleGenerateMonthly}>Générer Factures</Button>
            <Button leftSection={<IconPlus size={14} />} onClick={open}>Facture Manuelle</Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} keepMounted={false}>
        <Tabs.List mb="md">
          <Tabs.Tab value="invoices" leftSection={<IconList size={14}/>}>Gestion des Factures</Tabs.Tab>
          <Tabs.Tab value="reports" leftSection={<IconChartBar size={14}/>}>Rapports & Revenus</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="invoices">
            <Paper shadow="xs" p="md" withBorder style={{ minHeight: 200, position: 'relative' }}>
                <LoadingOverlay visible={loading} />
                
                {/* BARRE DE FILTRES */}
                <Group mb="md" grow>
                    <TextInput 
                        placeholder="Rechercher un client..." 
                        leftSection={<IconSearch size={16}/>}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    />
                    <Select 
                        data={[
                            { value: 'ALL', label: 'Tout voir' },
                            { value: 'PENDING', label: 'À Payer' },
                            { value: 'PAID', label: 'En Règle' },
                            { value: 'OVERDUE', label: 'En Retard' }
                        ]}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        allowDeselect={false}
                    />
                </Group>

                <Table striped highlightOnHover>
                <Table.Thead>
                    <Table.Tr><Table.Th>Client</Table.Th><Table.Th>Période</Table.Th><Table.Th>Montant</Table.Th><Table.Th>Échéance</Table.Th><Table.Th>Statut</Table.Th><Table.Th>Action</Table.Th></Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {rows}
                    {!loading && filteredInvoices.length === 0 && <Table.Tr><Table.Td colSpan={6} align="center" c="dimmed" py="xl">Aucune facture trouvée.</Table.Td></Table.Tr>}
                </Table.Tbody>
                </Table>
            </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="reports">
            {activeTab === 'reports' && stats && <RevenueChart data={stats.monthly} totalAllTime={stats.totalAllTime} />}
            {/* Tableau détail mensuel ici si besoin */}
        </Tabs.Panel>
      </Tabs>

      <CreateInvoiceModal opened={opened} close={close} onSuccess={fetchData} />
    </Container>
  );
}