import React, { useEffect, useState } from 'react';
import { Modal, Button, TextInput, Select, NumberInput, Stack, Group } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { api } from '../services/api';

interface Props {
  opened: boolean;
  close: () => void;
  onSuccess: () => void;
}

export default function CreateInvoiceModal({ opened, close, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<{value: string, label: string}[]>([]);

  // Charger la liste des clients pour le menu déroulant
  useEffect(() => {
    if (opened) {
      api.get('/clients').then(res => {
        const clientOptions = res.data.map((c: any) => ({
          value: c.id,
          label: `${c.name} (${c.district})`
        }));
        setClients(clientOptions);
      });
    }
  }, [opened]);

  const form = useForm({
    initialValues: {
      client_id: '',
      amount: 10, // Montant par défaut (ex: 10$)
      period: new Date().toISOString().slice(0, 7), // "YYYY-MM" par défaut
      due_date: new Date(),
    },
    validate: {
      client_id: (val) => (!val ? 'Client requis' : null),
      amount: (val) => (val <= 0 ? 'Montant invalide' : null),
      period: (val) => (val.length < 4 ? 'Période requise' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await api.post('/invoices', {
        ...values,
        // Conversion de la date pour le backend
        due_date: values.due_date.toISOString().split('T')[0]
      });
      
      form.reset();
      onSuccess();
      close();
    } catch (error) {
      console.error("Erreur facture:", error);
      alert("Erreur lors de la création de la facture.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title="Nouvelle Facture" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="Client"
            placeholder="Sélectionner un client"
            data={clients}
            searchable
            withAsterisk
            {...form.getInputProps('client_id')}
          />

          <NumberInput
            label="Montant ($)"
            placeholder="10"
            min={0}
            withAsterisk
            {...form.getInputProps('amount')}
          />

          <TextInput
            label="Période / Motif"
            placeholder="Ex: Décembre 2025"
            withAsterisk
            {...form.getInputProps('period')}
          />

          <DateInput
            label="Date limite de paiement"
            placeholder="Choisir une date"
            withAsterisk
            value={form.values.due_date}
            onChange={(date) => date && form.setFieldValue('due_date', date)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>Annuler</Button>
            <Button type="submit" loading={loading}>Générer la facture</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}