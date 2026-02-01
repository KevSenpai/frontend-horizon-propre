import React, { useState, useEffect } from 'react';
import { Modal, Button, TextInput, Select, MultiSelect, Stack, Group, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { api } from '../services/api';
import LocationPicker from './LocationPicker';

interface Props {
  opened: boolean;
  close: () => void;
  onSuccess: () => void;
  clientToEdit?: any | null;
}

export default function CreateClientModal({ opened, close, onSuccess, clientToEdit }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
      name: (val: string) => (val.length < 2 ? 'Nom trop court' : null),
      phone_number: (val: string) => (val.length < 5 ? 'Numéro invalide' : null),
      district: (val: string) => (val.length < 2 ? 'Quartier requis' : null),
      collection_days: (val: string[]) => (val.length === 0 ? 'Choisir au moins un jour' : null),
    },
  });

  // GESTION DU PRÉ-REMPLISSAGE (DATA BINDING)
  useEffect(() => {
    if (opened) {
      setErrorMsg(null);
      if (clientToEdit) {
        // Mode ÉDITION
        form.setValues({
          name: clientToEdit.name,
          phone_number: clientToEdit.phone_number,
          email: clientToEdit.email || '',
          street_address: clientToEdit.street_address,
          district: clientToEdit.district,
          city: clientToEdit.city,
          client_type: clientToEdit.client_type,
          service_type: clientToEdit.service_type,
          collection_days: clientToEdit.collection_days || [],
        });
        
        // --- C'EST ICI QUE LA MAGIE OPÈRE ---
        // On vérifie si la location existe
        if (clientToEdit.location && clientToEdit.location.coordinates) {
             // GeoJSON est [Long, Lat], Leaflet veut {lat, lng}
             // Donc index 1 = Lat, index 0 = Lng
             setGps({ 
                lat: clientToEdit.location.coordinates[1], 
                lng: clientToEdit.location.coordinates[0] 
            });
        } else {
            setGps(null);
        }
      } else {
        // Mode CRÉATION
        form.reset();
        setGps(null);
      }
    }
  }, [opened, clientToEdit]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!gps) {
      alert("Veuillez sélectionner une position sur la carte !");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        ...values,
        // Conversion inverse pour le Backend : [Lng, Lat]
        location: {
          type: 'Point',
          coordinates: [gps.lng, gps.lat],
        },
        location_status: 'VERIFIED'
      };

      if (clientToEdit) {
          await api.patch(`/clients/${clientToEdit.id}`, payload);
      } else {
          await api.post('/clients', payload);
      }

      form.reset();
      setGps(null);
      onSuccess();
      close();

    } catch (error: any) {
      console.error("Erreur client:", error);
      const status = error.response?.status;
      if (status === 409) setErrorMsg("Ce numéro de téléphone existe déjà !");
      else setErrorMsg("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title={clientToEdit ? "Modifier le client" : "Nouveau Client"} size="lg" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {errorMsg && <Alert variant="light" color="red" title="Erreur" icon={<IconAlertCircle />}>{errorMsg}</Alert>}

          <Group grow>
            <TextInput label="Nom complet" withAsterisk {...form.getInputProps('name')} />
            <TextInput label="Téléphone" withAsterisk {...form.getInputProps('phone_number')} />
          </Group>
          
          <TextInput label="Email" placeholder="client@mail.com" {...form.getInputProps('email')} />

          <Group grow>
            <TextInput label="Avenue / Rue" withAsterisk {...form.getInputProps('street_address')} />
            <TextInput label="Quartier" withAsterisk {...form.getInputProps('district')} />
          </Group>

          {/* ON PASSE LA POSITION INITIALE AU COMPOSANT */}
          <LocationPicker 
            onLocationSelect={(lat, lng) => setGps({ lat, lng })} 
            initialPosition={gps} 
          />

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
            <Button type="submit" loading={loading}>{clientToEdit ? "Sauvegarder" : "Enregistrer"}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}