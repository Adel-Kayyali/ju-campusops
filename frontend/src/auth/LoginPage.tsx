import { Alert, Anchor, Box, Button, Center, Group, Paper, PasswordInput, Stack, Text, TextInput, ThemeIcon, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconBuildingCommunity } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { errorMessage } from '@/api/apiError';
import { useAuth } from './AuthContext';


export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Enter a valid email'),
      password: (value) => (value.length > 0 ? null : 'Enter your password'),
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const submit = form.onSubmit(async ({ email, password }) => {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/', { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  });

  return (
    <Center mih="100vh" bg="var(--mantine-color-gray-0)" p="md">
      <Paper withBorder shadow="md" radius="md" p="xl" w="100%" maw={440}>
        <Stack gap="lg">
          <Group gap="sm">
            <ThemeIcon size={44} radius="md">
              <IconBuildingCommunity size={26} />
            </ThemeIcon>
            <Box>
              <Title order={2}>CampusOps</Title>
              <Text size="sm" c="dimmed">
                Smart Campus Facilities & Service Management
              </Text>
            </Box>
          </Group>

          {error && (
            <Alert color="red" icon={<IconAlertCircle size={18} />}>
              {error}
            </Alert>
          )}

          <form onSubmit={submit}>
            <Stack>
              <TextInput label="University email" placeholder="name@campusops.edu" autoComplete="username" {...form.getInputProps('email')} />
              <PasswordInput label="Password" autoComplete="current-password" {...form.getInputProps('password')} />
              <Button type="submit" loading={loading} fullWidth>
                Sign in
              </Button>
            </Stack>
          </form>
          <Text size="sm" ta="center">
            New to CampusOps?{' '}
            <Anchor component={Link} to="/register">
              Create an account
            </Anchor>
          </Text>

        </Stack>
      </Paper>
    </Center>
  );
}
