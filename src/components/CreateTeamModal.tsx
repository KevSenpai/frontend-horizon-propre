import React, { useState } from 'react';
import { Modal, Button, TextInput, Select, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { api } from '../services/api';

interface Props {
  opened: boolean;
  close: () => void;
  onSuccess: () => void;
}

export default function CreateTeamModal({ opened, close, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      members_info: '',
      status: 'ACTIVE',
    },
    validate: {
      // AJOUT DE ": string"
      name: (value: string) => (value.length < 2 ? 'Le nom doit avoir au moins 2 caractères' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await api.post('/teams', values);
      form.reset();
      onSuccess();
      close();
    } catch (error) {
      console.error("Erreur création équipe:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title="Créer une nouvelle équipe" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Nom de l'équipe"
            placeholder="Ex: Equipe Bravo"
            withAsterisk
            data-autofocus
            {...form.getInputProps('name')}
          />

          <TextInput
            label="Membres (Information)"
            placeholder="Ex: Jean, Paul, Jacques"
            {...form.getInputProps('members_info')}
          />

          <Select
            label="Statut initial"
            data={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
            {...form.getInputProps('status')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>Annuler</Button>
            <Button type="submit" loading={loading}>Créer l'équipe</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}