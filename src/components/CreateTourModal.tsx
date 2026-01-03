import React, { useEffect, useState } from 'react';
import { Modal, Button, TextInput, Select, Stack, Group, Alert, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import { api } from '../services/api';

interface Props {
  opened: boolean;
  close: () => void;
  onSuccess: () => void;
}

export default function CreateTourModal({ opened, close, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [teams, setTeams] = useState<{value: string, label: string}[]>([]);
  const [vehicles, setVehicles] = useState<{value: string, label: string}[]>([]);

  const form = useForm({
    initialValues: {
      name: '',
      tour_date: new Date(),
      team_id: '',
      vehicle_id: '',
    },
    validate: {
      name: (val: string) => (val.length < 2 ? 'Nom requis' : null),
      team_id: (val: string) => (!val ? 'Équipe requise' : null),
      vehicle_id: (val: string) => (!val ? 'Véhicule requis' : null),
    },
  });

  // Fonction pour charger les ressources DISPONIBLES pour une date
  const loadAvailableResources = async (date: Date) => {
    // Format YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0];
    
    try {
      // On vide les sélections actuelles car elles pourraient devenir invalides
      form.setFieldValue('team_id', '');
      form.setFieldValue('vehicle_id', '');

      // Appel API avec le paramètre ?date=...
      const [teamsRes, vehiclesRes] = await Promise.all([
        api.get(`/teams/available?date=${dateStr}`),
        api.get(`/vehicles/available?date=${dateStr}`)
      ]);

      setTeams(teamsRes.data.map((t: any) => ({ value: t.id, label: t.name })));
      setVehicles(vehiclesRes.data.map((v: any) => ({ value: v.id, label: `${v.name} (${v.license_plate})` })));

    } catch (e) {
      console.error("Erreur chargement ressources", e);
    }
  };

  // 1. Au chargement initial (Date du jour)
  useEffect(() => {
    if (opened) {
      loadAvailableResources(form.values.tour_date || new Date());
      setErrorMsg(null);
    }
  }, [opened]);

  // 2. Quand l'utilisateur change la date, on recharge les ressources
  const handleDateChange = (date: Date | null) => {
    if (date) {
      form.setFieldValue('tour_date', date);
      loadAvailableResources(date);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!values.tour_date) return;
    setLoading(true);
    setErrorMsg(null);
    
    try {
      const safeDate = new Date(values.tour_date);
      await api.post('/tours', {
        ...values,
        tour_date: safeDate.toISOString().split('T')[0]
      });
      
      form.reset();
      form.setFieldValue('tour_date', new Date());
      onSuccess();
      close();
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        setErrorMsg("Conflit : Ressource déjà occupée (vérification serveur).");
      } else {
        setErrorMsg("Erreur technique.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title="Planifier une Tournée" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
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
            value={form.values.tour_date}
            onChange={handleDateChange} // On utilise notre fonction custom
            error={form.errors.tour_date}
          />

          {/* SÉLECTION ÉQUIPE */}
          {teams.length > 0 ? (
             <Select
                label="Équipe disponible"
                placeholder="Choisir une équipe"
                data={teams}
                withAsterisk
                {...form.getInputProps('team_id')}
             />
          ) : (
             <Alert variant="light" color="orange" title="Indisponible" icon={<IconInfoCircle />}>
                Aucune équipe active n'est disponible pour cette date.
             </Alert>
          )}

          {/* SÉLECTION VÉHICULE */}
          {vehicles.length > 0 ? (
             <Select
                label="Véhicule disponible"
                placeholder="Choisir un camion"
                data={vehicles}
                withAsterisk
                {...form.getInputProps('vehicle_id')}
             />
          ) : (
             <Alert variant="light" color="orange" mt="xs" icon={<IconInfoCircle />}>
                Aucun véhicule opérationnel n'est disponible pour cette date.
             </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>Annuler</Button>
            <Button 
                type="submit" 
                loading={loading} 
                disabled={teams.length === 0 || vehicles.length === 0} // On bloque si pas de ressource
            >
                Créer le brouillon
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}