import React, { useEffect, useState } from 'react';
import { Container, Title, Paper, Table, Badge, Group, Button, Text, LoadingOverlay, Select, ActionIcon } from '@mantine/core';
import { IconPlus, IconCurrencyDollar, IconRefresh, IconCheck } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { api } from '../services/api';
import CreateInvoiceModal from '../components/CreateInvoiceModal';

export default function FinancePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>('ALL'); // Filtre statut
  const [opened, { open, close }] = useDisclosure(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices');
      if (Array.isArray(res.data)) {
        // Tri : D'abord les impayés, puis par date
        const sorted = res.data.sort((a: any, b: any) => {
            if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
            if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setInvoices(sorted);
      }
    } catch (error) {
      console.error("Erreur chargement", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  // Fonction pour générer les factures du mois
  const handleGenerateMonthly = async () => {
    if (!confirm("Générer automatiquement les factures pour tous les clients actifs ce mois-ci ?")) return;
    setLoading(true);
    try {
      const res = await api.post('/invoices/generate-monthly');
      alert(`${res.data.created} factures ont été générées pour ${res.data.period} !`);
      fetchInvoices();
    } catch (e) {
      alert("Erreur lors de la génération.");
    } finally {
      setLoading(false);
    }
  };

  // Fonction rapide pour marquer comme payé (Simulateur d'encaissement Cash)
  const handleMarkPaid = async (invoice: any) => {
    if(!confirm(`Confirmer le paiement de ${invoice.amount}$ pour ${invoice.client?.name} ?`)) return;
    try {
        // 1. Créer le paiement
        await api.post('/payments', {
            invoice_id: invoice.id,
            amount: Number(invoice.amount),
            method: 'CASH'
        });
        // 2. Mettre à jour la facture (le backend le fait peut-être auto, mais ici on force)
        await api.patch(`/invoices/${invoice.id}`, { status: 'PAID' });
        fetchInvoices();
    } catch (e) { alert("Erreur encaissement"); }
  };

  // Filtrage visuel
  const filteredInvoices = invoices.filter(inv => {
      if (filter === 'ALL') return true;
      return inv.status === filter;
  });

  const rows = filteredInvoices.map((inv) => (
    <Table.Tr key={inv.id} bg={inv.status === 'OVERDUE' ? 'red.0' : undefined}>
      <Table.Td>
        <Text fw={500}>{inv.client?.name || 'Client inconnu'}</Text>
        <Text size="xs" c="dimmed">{inv.client?.district}</Text>
      </Table.Td>
      <Table.Td>{inv.period}</Table.Td>
      <Table.Td fw={700}>{inv.amount} $</Table.Td>
      <Table.Td>
        <Badge 
            color={inv.status === 'PAID' ? 'green' : inv.status === 'PENDING' ? 'yellow' : 'red'} 
            variant="filled"
        >
          {inv.status === 'PAID' ? 'EN RÈGLE' : inv.status === 'PENDING' ? 'À PAYER' : 'RETARD'}
        </Badge>
      </Table.Td>
      <Table.Td>
        {inv.status === 'PENDING' && (
            <Button size="xs" color="green" leftSection={<IconCheck size={14}/>} onClick={() => handleMarkPaid(inv)}>
                Encaisser
            </Button>
        )}
        {inv.status === 'PAID' && <Text size="sm" c="dimmed">Payé le {new Date(inv.updated_at).toLocaleDateString()}</Text>}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Suivi Facturation</Title>
        <Group>
            <Button variant="light" color="violet" leftSection={<IconRefresh size={16}/>} onClick={handleGenerateMonthly}>
                Générer Factures du Mois
            </Button>
            <Button leftSection={<IconPlus size={14} />} onClick={open}>
                Facture Manuelle
            </Button>
        </Group>
      </Group>

      <Paper shadow="xs" p="md" withBorder style={{ minHeight: 200, position: 'relative' }}>
        <LoadingOverlay visible={loading} />
        
        <Group mb="md">
            <Text fw={500}>Filtrer par état :</Text>
            <Select 
                data={[
                    { value: 'ALL', label: 'Tout voir' },
                    { value: 'PENDING', label: 'À Payer (En attente)' },
                    { value: 'PAID', label: 'En Règle (Payé)' },
                    { value: 'OVERDUE', label: 'En Retard' }
                ]}
                value={filter}
                onChange={setFilter}
                allowDeselect={false}
            />
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Client</Table.Th>
              <Table.Th>Période</Table.Th>
              <Table.Th>Montant</Table.Th>
              <Table.Th>Statut</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows}
            {!loading && filteredInvoices.length === 0 && (
                 <Table.Tr><Table.Td colSpan={5} align="center" c="dimmed" py="xl">Aucune facture trouvée pour ce filtre.</Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <CreateInvoiceModal opened={opened} close={close} onSuccess={fetchInvoices} />
    </Container>
  );
}