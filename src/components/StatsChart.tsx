import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Title, Text } from '@mantine/core';

interface Props {
  data: any[];
}

export default function StatsChart({ data }: Props) {
  // Noms des jours en français (pour éviter les soucis de locale navigateur)
  const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const processData = () => {
    console.log("📊 Données reçues par le graphique :", data);

    const counts: Record<string, number> = {};
    const result = [];
    
    // 1. Initialiser les 7 derniers jours à 0
    // On part d'aujourd'hui et on recule
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        
        // On formate la date en clé unique "DD/MM" pour le stockage interne
        const dayKey = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        // On récupère le nom du jour pour l'affichage
        const dayName = DAYS_FR[d.getDay()];
        
        // On crée une clé composite pour l'affichage final
        const label = `${dayName} ${d.getDate()}`;
        
        // On initialise
        counts[dayKey] = 0;
        result.push({ fullDate: dayKey, name: label, tournees: 0 });
    }

    // 2. Remplir avec les vraies données
    data.forEach(tour => {
      if (!tour.tour_date) return;
      
      // On convertit la date de la tournée (YYYY-MM-DD) en Objet Date
      const tourDate = new Date(tour.tour_date);
      
      // On récupère la clé "DD/MM"
      const dayKey = tourDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

      // On cherche l'entrée correspondante dans notre tableau résultat
      const existingEntry = result.find(r => r.fullDate === dayKey);
      if (existingEntry) {
          existingEntry.tournees += 1;
      }
    });

    console.log("📈 Données traitées pour le graphique :", result);
    return result;
  };

  const chartData = processData();

  // Si pas de données du tout
  if (!data || data.length === 0) {
      return (
        <Paper withBorder p="md" radius="md" mt="lg" shadow="xs">
            <Title order={4} mb="md">Activité de la semaine</Title>
            <Text c="dimmed" ta="center" py="xl">Aucune donnée disponible pour le graphique.</Text>
        </Paper>
      );
  }

  return (
    <Paper withBorder p="md" radius="md" mt="lg" shadow="xs">
      <Title order={4} mb="md">Activité de la semaine</Title>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{fontSize: 12}} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="tournees" fill="#228be6" name="Tournées" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Paper>
  );
}