import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Title } from '@mantine/core';

interface Props {
  data: any[]; // On attendra une liste de tournées
}

export default function StatsChart({ data }: Props) {
  // Transformation des données : Compter les tournées par jour
  const processData = () => {
    const counts: Record<string, number> = {};
    
    data.forEach(tour => {
      // On suppose que tour.tour_date est "YYYY-MM-DD"
      // On prend juste le jour (DD) ou la date complète pour simplifier
      const date = new Date(tour.tour_date).toLocaleDateString('fr-FR', { weekday: 'short' }); // ex: "Lun"
      counts[date] = (counts[date] || 0) + 1;
    });

    return Object.keys(counts).map(key => ({
      name: key,
      tournees: counts[key]
    }));
  };

  const chartData = processData();

  return (
    <Paper withBorder p="md" radius="md" mt="lg">
      <Title order={4} mb="md">Activité de la Semaine</Title>
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