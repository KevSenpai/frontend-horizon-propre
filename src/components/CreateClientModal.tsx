import React, { useState } from 'react';
import { Modal, Button, TextInput, Select, MultiSelect, Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { api } from '../services/api';
import LocationPicker from './LocationPicker';

interface Props {
  opened: boolean;
  close: () => void;
  onSuccess: () => void;
}

export default function CreateClientModal({ opened, close, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [gps, setGps] = useState<{ lat: number, lng: number } | null>(null);

  const form = useForm({
    initialValues: {
      name: '',
      phone_number: '',
      email: '',
      street_address: '',
      district: '',
      city: 'Goma',
      client_type: 'RESIDENTIAL',
      service_type: 'WEEKLY_STANDARD',
      collection_days: [],
    },
    validate: {
      name: (val) => (val.length < 2 ? 'Nom trop court' : null),
      phone_number: (val) => (val.length < 5 ? 'Numéro invalide' : null),
      district: (val) => (val.length < 2 ? 'Quartier requis' : null),
      collection_days: (val) => (val.length === 0 ? 'Choisir au moins un jour' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (!gps) {
      alert("Veuillez sélectionner une position sur la carte !");
      return;
    }

    setLoading(true);
    try {
      // Construction de l'objet pour le Backend
      const payload = {
        ...values,
        location: {
          type: 'Point',
          coordinates: [gps.lat, gps.lng], // Attention l'ordre peut varier selon les systèmes, ici on tente Lat/Lng standard
        },
        location_status: 'VERIFIED'
      };

      await api.post('/clients', payload);
      form.reset();
      setGps(null);
      onSuccess();
      close();
    } catch (error) {
      console.error("Erreur création client:", error);
      alert("Erreur lors de la création (Vérifiez le numéro de téléphone unique)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title="Nouveau Client" size="lg" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Group grow>
            <TextInput label="Nom complet" placeholder="Mme. Kavira" withAsterisk {...form.getInputProps('name')} />
            <TextInput label="Téléphone" placeholder="+243..." withAsterisk {...form.getInputProps('phone_number')} />
          </Group>
          
          <TextInput label="Email" placeholder="client@mail.com" {...form.getInputProps('email')} />

          <Group grow>
            <TextInput label="Avenue / Rue" withAsterisk {...form.getInputProps('street_address')} />
            <TextInput label="Quartier" withAsterisk {...form.getInputProps('district')} />
          </Group>

          {/* LA CARTE */}
          <LocationPicker onLocationSelect={(lat, lng) => setGps({ lat, lng })} />

          <Group grow>
            <Select 
              label="Type Client" 
              data={['RESIDENTIAL', 'COMMERCIAL_SMALL', 'COMMERCIAL_LARGE', 'INSTITUTIONAL']}
              {...form.getInputProps('client_type')} 
            />
            <Select 
              label="Type Service" 
              data={['WEEKLY_STANDARD', 'BI_WEEKLY', 'ON_DEMAND']}
              {...form.getInputProps('service_type')} 
            />
          </Group>

          <MultiSelect
            label="Jours de collecte"
            data={['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']}
            withAsterisk
            {...form.getInputProps('collection_days')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>Annuler</Button>
            <Button type="submit" loading={loading}>Enregistrer le client</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}