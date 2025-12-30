import React, { useEffect, useState } from 'react';
import { Modal, Button, TextInput, Select, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { api } from '../services/api';

interface Props {
  opened: boolean;
  close: () => void;
  onSuccess: () => void;
  teamToEdit?: any | null; // <--- C'EST LA LIGNE QUI MANQUE CHEZ VOUS
}

export default function CreateTeamModal({ opened, close, onSuccess, teamToEdit }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      members_info: '',
      status: 'ACTIVE',
    },
    validate: {
      name: (value: string) => (value.length < 2 ? 'Le nom doit avoir au moins 2 caractères' : null),
    },
  });

  // Effet pour pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (opened) {
      if (teamToEdit) {
        // Mode ÉDITION
        form.setValues({
          name: teamToEdit.name,
          members_info: teamToEdit.members_info || '',
          status: teamToEdit.status,
        });
      } else {
        // Mode CRÉATION
        form.reset();
      }
    }
  }, [opened, teamToEdit]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      if (teamToEdit) {
        // UPDATE (PATCH)
        await api.patch(`/teams/${teamToEdit.id}`, values);
      } else {
        // CREATE (POST)
        await api.post('/teams', values);
      }
      
      form.reset();
      onSuccess();
      close();
    } catch (error) {
      console.error("Erreur sauvegarde équipe:", error);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title={teamToEdit ? "Modifier l'équipe" : "Créer une équipe"} 
      centered
    >
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
            label="Statut"
            data={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
            {...form.getInputProps('status')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>Annuler</Button>
            <Button type="submit" loading={loading}>
              {teamToEdit ? "Enregistrer" : "Créer"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}