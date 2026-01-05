import React, { useState } from 'react';
import { Container, Paper, Title, TextInput, PasswordInput, Button, Stack, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { api } from '../services/api';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      // CORRECTION ICI : Ajout du type ': string'
      email: (val: string) => (/^\S+@\S+$/.test(val) ? null : 'Email invalide'),
      password: (val: string) => (val.length < 6 ? 'Mot de passe trop court' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);
    try {
      // Appel au Backend pour avoir le token
      const res = await api.post('/auth/login', values);
      
      // Stockage du token dans le navigateur
      localStorage.setItem('access_token', res.data.access_token);
      
      // Redirection vers l'accueil
      window.location.href = '/';
      
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect.');
      } else {
        setError('Erreur de connexion serveur.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb={30}>Horizon Propre 🌍</Title>
      
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {error && (
                <MantineAlert color="red" icon={<IconAlertCircle />}>{error}</MantineAlert>
            )}
            
            <TextInput 
                label="Email" 
                placeholder="admin@horizon.com" 
                required 
                {...form.getInputProps('email')} 
            />
            
            <PasswordInput 
                label="Mot de passe" 
                placeholder="Votre mot de passe" 
                required 
                mt="md" 
                {...form.getInputProps('password')} 
            />
            
            <Button fullWidth mt="xl" type="submit" loading={loading}>
              Se connecter
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

// Petit helper pour l'alerte si l'import direct ne marche pas (dépend des versions Mantine)
function MantineAlert({ children, color, icon }: any) {
    return <Alert color={color} icon={icon} title="Erreur">{children}</Alert>;
}