import React from 'react';
import { AppShell, Burger, Group, Title, NavLink, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUsers, IconTruck, IconMapPin, IconDashboard, IconUser } from '@tabler/icons-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
// Import des pages
import TeamsPage from './pages/TeamsPage';
import VehiclesPage from './pages/VehiclesPage';
import ClientsPage from './pages/ClientsPage';
import ToursPage from './pages/ToursPage';
import TourDetailsPage from './pages/TourDetailsPage'; // <--- 1. IMPORT ICI

export default function App() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'Tableau de bord', icon: IconDashboard, path: '/' },
    { label: 'Équipes', icon: IconUsers, path: '/teams' },
    { label: 'Clients', icon: IconUser, path: '/clients' },
    { label: 'Véhicules', icon: IconTruck, path: '/vehicles' },
    { label: 'Planification', icon: IconMapPin, path: '/planning' },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group gap="xs">
            <Text size="xl">🌍</Text>
            <Title order={3}>Horizon Propre</Title>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            label={item.label}
            leftSection={<item.icon size="1rem" stroke={1.5} />}
            active={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))} // Petit fix pour garder le menu actif
            onClick={() => { navigate(item.path); if (opened) toggle(); }}
            variant="light"
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/" element={<DashboardPage />} />
          {/* Routes de Planification */}
          <Route path="/planning" element={<ToursPage />} />
          <Route path="/planning/:id" element={<TourDetailsPage />} /> {/* <--- 2. ROUTE AJOUTÉE ICI */}
          
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}