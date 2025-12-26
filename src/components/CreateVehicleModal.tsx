import React, { useState } from 'react';
import { Modal, Button, TextInput, Select, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { api } from '../services/api';

interface Props {
  opened: boolean;
  close: () => void;
  onSuccess: () => void;
}

export default function CreateVehicleModal({ opened, close, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      license_plate: '',
      status: 'OPERATIONAL',
    },
    validate: {
      name: (value : string) => (value.length < 2 ? 'Le nom est trop court' : null),
      license_plate: (value : string) => (value.length < 2 ? 'Plaque requise' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await api.post('/vehicles', values);
      form.reset();
      onSuccess();
      close();
    } catch (error) {
      console.error("Erreur création véhicule:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title="Ajouter un véhicule" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Nom du véhicule"
            placeholder="Ex: Camion Benne 01"
            withAsterisk
            data-autofocus
            {...form.getInputProps('name')}
          />

          <TextInput
            label="Plaque d'immatriculation"
            placeholder="Ex: CGO-1234-AB"
            withAsterisk
            {...form.getInputProps('license_plate')}
          />

          <Select
            label="Statut"
            data={[
              { value: 'OPERATIONAL', label: 'Opérationnel' },
              { value: 'MAINTENANCE', label: 'En Maintenance' },
            ]}
            {...form.getInputProps('status')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>Annuler</Button>
            <Button type="submit" loading={loading}>Créer</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}