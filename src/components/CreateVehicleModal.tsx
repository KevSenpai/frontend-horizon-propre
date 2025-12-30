import React, { useState, useEffect } from 'react';
import { Modal, Button, TextInput, Select, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { api } from '../services/api';

interface Props {
  opened: boolean;
  close: () => void;
  onSuccess: () => void;
  vehicleToEdit?: any | null; // <--- AJOUT PROPS
}

export default function CreateVehicleModal({ opened, close, onSuccess, vehicleToEdit }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      license_plate: '',
      status: 'OPERATIONAL',
    },
    validate: {
      name: (value: string) => (value.length < 2 ? 'Nom trop court' : null),
      license_plate: (value: string) => (value.length < 2 ? 'Plaque requise' : null),
    },
  });

  // Pré-remplissage en mode édition
  useEffect(() => {
    if (opened) {
      if (vehicleToEdit) {
        form.setValues({
          name: vehicleToEdit.name,
          license_plate: vehicleToEdit.license_plate,
          status: vehicleToEdit.status,
        });
      } else {
        form.reset();
      }
    }
  }, [opened, vehicleToEdit]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      if (vehicleToEdit) {
        // UPDATE
        await api.patch(`/vehicles/${vehicleToEdit.id}`, values);
      } else {
        // CREATE
        await api.post('/vehicles', values);
      }
      form.reset();
      onSuccess();
      close();
    } catch (error) {
      console.error("Erreur véhicule:", error);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title={vehicleToEdit ? "Modifier le véhicule" : "Ajouter un véhicule"} 
      centered
    >
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
            <Button type="submit" loading={loading}>
              {vehicleToEdit ? "Sauvegarder" : "Créer"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}