import React, { useEffect, useState } from 'react';
import { Container, Grid, Paper, Text, Group, Title, ThemeIcon, SimpleGrid, Button, RingProgress, Center } from '@mantine/core';
import { IconUsers, IconTruck, IconMapPin, IconArrowRight, IconCalendarEvent } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import StatsChart from '../components/StatsChart';

export default function DashboardPage() {
  const navigate = useNavigate();
  
  // États pour les statistiques
  const [stats, setStats] = useState({
    totalClients: 0,
    activeTeams: 0,
    toursToday: 0,
    toursPlanned: 0
  });

  const [loading, setLoading] = useState(true);
  const [rawTours, setRawTours] = useState<any[]>([]);
  useEffect(() => {
    async function loadStats() {
      try {
        // On lance les 3 requêtes en parallèle pour aller vite
        const [clientsRes, teamsRes, toursRes] = await Promise.all([
          api.get('/clients'),
          api.get('/teams'),
          api.get('/tours')
        ]);

        // Calculs simples
        const today = new Date().toISOString().split('T')[0];
        
        const toursToday = toursRes.data.filter((t: any) => t.tour_date === today).length;
        const toursPlanned = toursRes.data.filter((t: any) => t.status === 'PLANNED').length;
        const activeTeams = teamsRes.data.filter((t: any) => t.status === 'ACTIVE').length;

        setStats({
          totalClients: clientsRes.data.length,
          activeTeams: activeTeams,
          toursToday: toursToday,
          toursPlanned: toursPlanned
        });
        setRawTours(toursRes.data);
      } catch (error) {
        console.error("Erreur chargement stats", error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  // Composant pour une carte de Statistique
  function StatCard({ title, value, icon, color, description }: any) {
    return (
      <Paper withBorder p="md" radius="md" shadow="xs">
        <Group justify="space-between">
          <div>
            <Text c="dimmed" tt="uppercase" fw={700} fz="xs">
              {title}
            </Text>
            <Text fw={700} fz="xl">
              {loading ? '...' : value}
            </Text>
            <Text fz="xs" c="dimmed" mt={5}>{description}</Text>
          </div>
          <ThemeIcon color={color} variant="light" size={38} radius="md">
            {icon}
          </ThemeIcon>
        </Group>
      </Paper>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group mb="lg">
        <div>
          <Title order={2}>Tableau de Bord 🌍</Title>
          <Text c="dimmed">Bienvenue sur Horizon Propre Manager</Text>
        </div>
        <Text ml="auto" fw={500} c="blue">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </Group>

      {/* 1. LES CHIFFRES CLÉS */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="xl">
        <StatCard 
          title="Tournées Aujourd'hui" 
          value={stats.toursToday} 
          icon={<IconCalendarEvent size={20} />} 
          color="blue"
          description="Prévues pour cette date"
        />
        <StatCard 
          title="Clients Total" 
          value={stats.totalClients} 
          icon={<IconUsers size={20} />} 
          color="cyan"
          description="Enregistrés dans la base"
        />
        <StatCard 
          title="Équipes Actives" 
          value={stats.activeTeams} 
          icon={<IconTruck size={20} />} 
          color="orange"
          description="Prêtes à intervenir"
        />
      </SimpleGrid>

      <Grid>
        {/* 2. SECTION ACTIONS RAPIDES */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Title order={4} mb="md">Actions Rapides</Title>
            <SimpleGrid cols={2}>
                <Button 
                    variant="light" 
                    size="lg" 
                    leftSection={<IconMapPin />} 
                    onClick={() => navigate('/planning')}
                    justify="space-between"
                    rightSection={<IconArrowRight size={16} />}
                >
                    Planifier une tournée
                </Button>
                
                <Button 
                    variant="light" 
                    color="cyan"
                    size="lg" 
                    leftSection={<IconUsers />} 
                    onClick={() => navigate('/clients')}
                    justify="space-between"
                    rightSection={<IconArrowRight size={16} />}
                >
                    Ajouter un client
                </Button>
            </SimpleGrid>
          </Paper>
        </Grid.Col>

        {/* 3. SECTION STATUT GLOBAL */}
        <Grid.Col span={{ base: 12, md: 5 }}>
            <Paper withBorder p="md" radius="md" h="100%">
                <Title order={4} mb="md">État du Planning</Title>
                <Center>
                    <RingProgress
                        size={170}
                        thickness={16}
                        roundCaps
                        label={
                            <Text size="xs" ta="center" c="dimmed">
                                En attente de<br />Validation
                            </Text>
                        }
                        sections={[
                            { value: (stats.toursToday > 0 ? ((stats.toursToday - stats.toursPlanned) / stats.toursToday) * 100 : 0), color: 'gray', tooltip: 'Brouillon' },
                            { value: (stats.toursToday > 0 ? (stats.toursPlanned / stats.toursToday) * 100 : 0), color: 'blue', tooltip: 'Validée' },
                        ]}
                    />
                </Center>
                <Center mt="md">
                    <Group>
                        <Group gap={5}><div style={{width: 10, height: 10, borderRadius: '50%', background: '#228be6'}}></div><Text size="xs">Validées</Text></Group>
                        <Group gap={5}><div style={{width: 10, height: 10, borderRadius: '50%', background: '#adb5bd'}}></div><Text size="xs">Brouillons</Text></Group>
                    </Group>
                </Center>
            </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}