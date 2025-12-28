import React, { useState } from 'react';
import { Modal, Button, TextInput, Select, MultiSelect, Stack, Group, Alert as MantineAlert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { api } from '../services/api';
import LocationPicker from './LocationPicker';

interface Props {
  opened: boolean;
  close: () => void;
  onSuccess: () => void;
}

export default function CreateClientModal({ opened, close, onSuccess }: Props) {
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

  const handleSubmit = async (values: typeof form.values) => {
    if (!gps) {
      alert("Veuillez sélectionner une position sur la carte !");
      return;
    }

    setLoading(true);
    setErrorMsg(null); // On efface les anciennes erreurs

    try {
      const payload = {
        ...values,
        location: {
          type: 'Point',
          coordinates: [gps.lat, gps.lng],
        },
        location_status: 'VERIFIED'
      };

      // Appel API
      await api.post('/clients', payload);

      // Si on arrive ici, c'est un SUCCÈS
      form.reset();
      setGps(null);
      onSuccess();
      close();

    } catch (error: any) {
      console.error("ERREUR DANS LA MODALE :", error);

      // 1. Déterminer le message d'erreur
      let message = "Une erreur inconnue est survenue.";

      if (error.response) {
        // Le serveur a répondu avec une erreur (4xx, 5xx)
        const status = error.response.status;
        const data = error.response.data;
        
        console.log("Status:", status, "Data:", data);

        if (status === 409) {
          message = "Ce numéro de téléphone existe déjà !";
        } else if (status === 500) {
           // Si le backend renvoie un message spécifique dans 'message'
           message = data.message || "Erreur interne du serveur (500).";
        } else {
           message = `Erreur (${status}): ${data.message || 'Problème serveur'}`;
        }
      } else if (error.request) {
        // La requête est partie mais pas de réponse (problème réseau)
        message = "Impossible de contacter le serveur. Vérifiez votre connexion.";
      } else {
        message = error.message;
      }

      // 2. Mettre à jour l'affichage dans la modale
      setErrorMsg(message);
      
      // 3. FORCE BRUTE : Afficher une alerte navigateur pour être sûr que vous le voyez
      window.alert("ERREUR : " + message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title="Nouveau Client" size="lg" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {/* Zone d'affichage de l'erreur (Bandeau Rouge) */}
          {errorMsg && (
            <MantineAlert variant="light" color="red" title="Attention" icon={<IconAlertCircle />}>
              {errorMsg}
            </MantineAlert>
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
            <Button type="submit" loading={loading}>Enregistrer le client</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}