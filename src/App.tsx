import React from 'react';
import { AppShell, Burger, Group, Title, NavLink, Text, Button, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUsers, IconTruck, IconMapPin, IconDashboard, IconUser, IconHistory, IconCurrencyDollar, IconWorld } from '@tabler/icons-react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

import TeamsPage from './pages/TeamsPage';
import VehiclesPage from './pages/VehiclesPage';
import ClientsPage from './pages/ClientsPage';
import ToursPage from './pages/ToursPage';
import TourDetailsPage from './pages/TourDetailsPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import FinancePage from './pages/FinancePage';
import LoginPage from './pages/LoginPage';
import GlobalMapPage from './pages/GlobalMapPage';
export default function App() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role'); // Récupération du rôle

  if (!token) {
    return <LoginPage />;
  }

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  // --- DÉFINITION DES MENUS AVEC DROITS ---
  const allMenuItems = [
    { label: 'Tableau de bord', icon: IconDashboard, path: '/', roles: ['ADMIN', 'PLANNER'] },
    // Gestion des ressources : Admin seulement
    { label: 'Équipes', icon: IconUsers, path: '/teams', roles: ['ADMIN'] }, 
    { label: 'Véhicules', icon: IconTruck, path: '/vehicles', roles: ['ADMIN'] },
    // Clients : Admin (et Planner en lecture peut-être, mais disons Admin pour la création)
    { label: 'Clients', icon: IconUser, path: '/clients', roles: ['ADMIN'] },
    // Planification : Tout le monde
    { label: 'Planification', icon: IconMapPin, path: '/planning', roles: ['ADMIN', 'PLANNER'] },
    { label: 'Historique', icon: IconHistory, path: '/history', roles: ['ADMIN', 'PLANNER'] },
    // Finance : Admin seulement
    { label: 'Finance', icon: IconCurrencyDollar, path: '/finance', roles: ['ADMIN'] },
    { label: 'Carte Globale', icon: IconWorld, path: '/map', roles: ['ADMIN', 'PLANNER'] },
  ];

  // Filtrer les menus visibles
  const visibleMenu = allMenuItems.filter(item => item.roles.includes(userRole || ''));

  // Composant de protection de route (Redirige si pas le droit)
  const ProtectedRoute = ({ children, roles }: { children: any, roles: string[] }) => {
    if (!roles.includes(userRole || '')) {
      return <div style={{padding: 20}}>Accès interdit. <Button onClick={() => navigate('/')}>Retour accueil</Button></div>;
    }
    return children;
  };

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
            <Badge variant="light" color="gray">{userRole}</Badge>
          </Group>
          <Button variant="subtle" color="red" size="xs" ml="auto" onClick={handleLogout}>
            Déconnexion
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {visibleMenu.map((item) => (
          <NavLink
            key={item.label}
            label={item.label}
            leftSection={<item.icon size="1rem" stroke={1.5} />}
            active={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))}
            onClick={() => { navigate(item.path); if (opened) toggle(); }}
            variant="light"
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">
        <Routes>
          {/* Routes Accessibles à tous (Admin + Planner) */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/planning" element={<ToursPage />} />
          <Route path="/planning/:id" element={<TourDetailsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/map" element={<GlobalMapPage />} /> 
          {/* Routes ADMIN UNIQUEMENT */}
          <Route path="/teams" element={<ProtectedRoute roles={['ADMIN']}><TeamsPage /></ProtectedRoute>} />
          <Route path="/vehicles" element={<ProtectedRoute roles={['ADMIN']}><VehiclesPage /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute roles={['ADMIN']}><ClientsPage /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute roles={['ADMIN']}><FinancePage /></ProtectedRoute>} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}