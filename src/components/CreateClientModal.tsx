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
  clientToEdit?: any | null; // <--- Défini ici
}

// CORRECTION ICI : On ajoute clientToEdit dans les paramètres
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

  // Effet pour remplir le formulaire en mode édition
  useEffect(() => {
    if (opened) {
      setErrorMsg(null);
      if (clientToEdit) {
        // Mode ÉDITION : On remplit
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
        
        // On remplit le GPS si dispo
        if (clientToEdit.location && clientToEdit.location.coordinates) {
             setGps({ 
                lat: clientToEdit.location.coordinates[0], 
                lng: clientToEdit.location.coordinates[1] 
            });
        }
      } else {
        // Mode CRÉATION : On vide
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
        location: {
          type: 'Point',
          coordinates: [gps.lat, gps.lng],
        },
        location_status: 'VERIFIED'
      };

      // C'EST ICI QUE VOUS AVIEZ L'ERREUR
      if (clientToEdit) {
          // Si on édite, on fait un PATCH avec l'ID
          await api.patch(`/clients/${clientToEdit.id}`, payload);
      } else {
          // Sinon on crée
          await api.post('/clients', payload);
      }

      form.reset();
      setGps(null);
      onSuccess();
      close();

    } catch (error: any) {
      console.error("Erreur client:", error);
      const status = error.response?.status;
      if (status === 409) {
          setErrorMsg("Ce numéro de téléphone existe déjà !");
      } else {
          setErrorMsg("Une erreur est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title={clientToEdit ? "Modifier le client" : "Nouveau Client"} size="lg" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {errorMsg && (
            <Alert variant="light" color="red" title="Erreur" icon={<IconAlertCircle />}>
              {errorMsg}
            </Alert>
          )}

          <Group grow>
            <TextInput label="Nom complet" placeholder="Mme. Kavira" withAsterisk {...form.getInputProps('name')} />
            <TextInput label="Téléphone" placeholder="+243..." withAsterisk {...form.getInputProps('phone_number')} />
          </Group>
          
          <TextInput label="Email" placeholder="client@mail.com" {...form.getInputProps('email')} />

          <Group grow>
            <TextInput label="Avenue / Rue" withAsterisk {...form.getInputProps('street_address')} />
            <TextInput label="Quartier" withAsterisk {...form.getInputProps('district')} />
          </Group>

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
            <Button type="submit" loading={loading}>{clientToEdit ? "Sauvegarder" : "Créer"}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}