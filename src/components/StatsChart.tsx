import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Title, Text } from '@mantine/core';

interface Props {
  data: any[];
}

// 1. On définit le type des données du graphique
interface ChartData {
  fullDate: string;
  name: string;
  tournees: number;
}

export default function StatsChart({ data }: Props) {
  const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const processData = () => {
    // 2. On type explicitement le tableau 'result'
    const result: ChartData[] = [];
    
    // Initialiser les 7 derniers jours
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        
        const dayKey = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        const dayName = DAYS_FR[d.getDay()];
        const label = `${dayName} ${d.getDate()}`;
        
        result.push({ fullDate: dayKey, name: label, tournees: 0 });
    }

    // Remplir avec les vraies données
    if (data) {
        data.forEach(tour => {
          if (!tour.tour_date) return;
          
          const tourDate = new Date(tour.tour_date);
          const dayKey = tourDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    
          const existingEntry = result.find(r => r.fullDate === dayKey);
          if (existingEntry) {
              existingEntry.tournees += 1;
          }
        });
    }

    return result;
  };

 // ... (code précédent inchangé)

  const chartData = processData();

  // Si pas de données, on affiche un message simple (évite le crash Recharts)
  if (!data || data.length === 0) {
      return (
        <Paper withBorder p="md" radius="md" mt="lg" shadow="xs">
            <Title order={4} mb="md">Activité de la semaine</Title>
            <Text c="dimmed" ta="center" py="xl">Aucune donnée disponible.</Text>
        </Paper>
      );
  }

  // ... (code précédent inchangé)

  return (
    <Paper withBorder p="md" radius="md" mt="lg" shadow="xs">
      <Title order={4} mb="md">Activité de la semaine</Title>
      
      {/* AJOUT DE minWidth: 0 ICI 👇 */}
      <div style={{ position: 'relative', width: '100%', height: 300, minWidth: 0 }}>
        {chartData.length > 0 ? (
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="tournees" fill="#228be6" name="Tournées" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
        ) : (
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Text c="dimmed">Aucune donnée disponible.</Text>
             </div>
        )}
      </div>
    </Paper>
  );
}