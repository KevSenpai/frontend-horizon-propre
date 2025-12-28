import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Title } from '@mantine/core';

// Définition stricte des propriétés (Props)
interface Props {
  data: any[];
}

export default function StatsChart({ data }: Props) {
  // Transformation des données
  const processData = () => {
    const counts: Record<string, number> = {};
    
    // Initialiser les 7 derniers jours
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // Format court pour l'axe X (ex: "Lun", "Mar")
        const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
        if (!counts[dayName]) counts[dayName] = 0;
    }

    // Compter les tournées
    data.forEach(tour => {
      if (!tour.tour_date) return;
      const date = new Date(tour.tour_date).toLocaleDateString('fr-FR', { weekday: 'short' });
      if (counts[date] !== undefined) {
          counts[date] += 1;
      }
    });

    return Object.keys(counts).map(key => ({
      name: key,
      tournees: counts[key]
    }));
  };

  const chartData = processData();

  return (
    <Paper withBorder p="md" radius="md" mt="lg" shadow="xs">
      <Title order={4} mb="md">Activité de la semaine</Title>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="tournees" fill="#228be6" name="Tournées" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Paper>
  );
}