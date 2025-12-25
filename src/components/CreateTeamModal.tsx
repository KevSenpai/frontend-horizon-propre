import React from 'react'; 
import { Modal, Button, TextInput, Select, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { api } from '../services/api';

interface Props {
  opened: boolean;
  close: () => void;
  onSuccess: () => void; // Fonction appelée quand l'équipe est créée pour rafraîchir la liste
}

export default function CreateTeamModal({ opened, close, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  // Configuration du formulaire avec Mantine Form
  const form = useForm({
    initialValues: {
      name: '',
      members_info: '',
      status: 'ACTIVE',
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Le nom doit avoir au moins 2 caractères' : null),
    },
  });

  // Fonction d'envoi
  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      // Appel au Backend
      await api.post('/teams', values);
      
      // Si succès :
      form.reset(); // On vide le formulaire
      onSuccess();  // On dit au parent de rafraîchir la liste
      close();      // On ferme la modale
    } catch (error) {
      console.error("Erreur création équipe:", error);
      // Ici on pourrait ajouter une notification d'erreur plus tard
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