import React, { useEffect, useState } from 'react';
import { Modal, Button, TextInput, Select, Stack, Group, Alert } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { api } from '../services/api';

interface Props {
  opened: boolean;
  close: () => void;
  onSuccess: () => void;
}

export default function CreateTourModal({ opened, close, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // États pour les listes déroulantes
  const [teams, setTeams] = useState<{value: string, label: string}[]>([]);
  const [vehicles, setVehicles] = useState<{value: string, label: string}[]>([]);

  const form = useForm({
    initialValues: {
      name: '',
      tour_date: new Date(), // Important : Initialiser avec un objet Date
      team_id: '',
      vehicle_id: '',
    },
    validate: {
      name: (val) => (val.length < 2 ? 'Nom requis' : null),
      team_id: (val) => (!val ? 'Équipe requise' : null),
      vehicle_id: (val) => (!val ? 'Véhicule requis' : null),
    },
  });

  // Charger les équipes et véhicules quand la modale s'ouvre
  useEffect(() => {
    if (opened) {
      setErrorMsg(null); // Reset erreur à l'ouverture
      
      api.get('/teams').then(res => {
        const activeTeams = res.data
          .filter((t: any) => t.status === 'ACTIVE')
          .map((t: any) => ({ value: t.id, label: t.name }));
        setTeams(activeTeams);
      });

      api.get('/vehicles').then(res => {
        const activeVehicles = res.data
          .filter((v: any) => v.status === 'OPERATIONAL')
          .map((v: any) => ({ value: v.id, label: `${v.name} (${v.license_plate})` }));
        setVehicles(activeVehicles);
      });
    }
  }, [opened]);

  // Fonction de soumission (Corrigée et Sécurisée)
  const handleSubmit = async (values: typeof form.values) => {
    // 1. Validation de sécurité pour la date
    if (!values.tour_date) {
        alert("Veuillez sélectionner une date valide.");
        return;
    }

    setLoading(true);
    setErrorMsg(null);
    
    try {
      // 2. Conversion sécurisée en objet Date
      const safeDate = new Date(values.tour_date);
      
      const payload = {
        ...values,
        // On formate en string YYYY-MM-DD pour le backend
        tour_date: safeDate.toISOString().split('T')[0]
      };

      await api.post('/tours', payload);
      
      // Reset du formulaire
      form.reset();
      form.setFieldValue('tour_date', new Date()); // Remettre la date du jour
      
      onSuccess();
      close();
    } catch (error: any) {
      console.error("Erreur création tournée:", error);
      
      // Gestion spécifique du conflit 409
      if (error.response && error.response.status === 409) {
        setErrorMsg("Conflit : Cette équipe ou ce véhicule est déjà pris à cette date !");
      } else {
        setErrorMsg("Erreur technique lors de la création.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title="Planifier une Tournée" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {/* Zone d'affichage des erreurs */}
          {errorMsg && (
            <Alert variant="light" color="red" title="Erreur" icon={<IconAlertCircle />}>
              {errorMsg}
            </Alert>
          )}

          <TextInput 
            label="Nom de la tournée" 
            placeholder="Ex: Matinée - Zone Nord" 
            withAsterisk 
            data-autofocus
            {...form.getInputProps('name')} 
          />

          <DateInput
            label="Date de la tournée"
            placeholder="Choisir une date"
            withAsterisk
            // On force la valeur à être gérée comme une Date par le composant
            value={form.values.tour_date}
            onChange={(date) => form.setFieldValue('tour_date', date)}
            error={form.errors.tour_date}
          />

          <Select
            label="Équipe assignée"
            placeholder="Choisir une équipe"
            data={teams}
            withAsterisk
            {...form.getInputProps('team_id')}
          />

          <Select
            label="Véhicule assigné"
            placeholder="Choisir un camion"
            data={vehicles}
            withAsterisk
            {...form.getInputProps('vehicle_id')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>Annuler</Button>
            <Button type="submit" loading={loading}>Créer le brouillon</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}