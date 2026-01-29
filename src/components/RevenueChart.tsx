import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Title, Text, Group, ThemeIcon } from '@mantine/core';
import { IconTrendingUp } from '@tabler/icons-react';

interface Props {
  data: { month: string; total: number }[];
  totalAllTime: number;
}

export default function RevenueChart({ data, totalAllTime }: Props) {
  // On inverse les données pour l'affichage (de gauche à droite chronologique)
  const chartData = [...data].reverse();

  // ... (code précédent inchangé)

  return (
    <Paper withBorder p="md" radius="md" shadow="xs" mb="lg">
      <Group justify="space-between" mb="lg">
        <div>
            <Title order={4}>Évolution des Revenus</Title>
            <Text c="dimmed" size="xs">Encaissements réels (Paiements reçus)</Text>
        </div>
        <Group>
            <ThemeIcon color="green" variant="light" size="lg"><IconTrendingUp /></ThemeIcon>
            <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Encaissé</Text>
                <Text fw={700} size="xl" c="green">{totalAllTime.toLocaleString()} $</Text>
            </div>
        </Group>
      </Group>

      {/* CORRECTION ICI : Styles explicites pour éviter le crash width(-1) */}
      <div style={{ width: '100%', height: 300, minWidth: 0, minHeight: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#40c057" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#40c057" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{fontSize: 12}} />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip formatter={(value) => [`${value} $`, 'Revenus']} />
            <Area type="monotone" dataKey="total" stroke="#40c057" fillOpacity={1} fill="url(#colorTotal)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Paper>
  );
}