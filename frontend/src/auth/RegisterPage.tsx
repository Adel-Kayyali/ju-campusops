import { Alert, Anchor, Box, Button, Center, Group, Paper, PasswordInput, SegmentedControl, SimpleGrid, Stack, Text, TextInput, ThemeIcon, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconBuildingCommunity } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { errorMessage } from '@/api/apiError';
import { notify } from '@/shared/utils/notify';
import { useAuth } from './AuthContext';
import { PasswordChecklist } from './PasswordChecklist';
import { passwordError } from './passwordPolicy';
import type { RegisterInput } from './types';

/**
 * Self-service sign-up for students, staff and teachers. There is no e-mail verification:
 * the account works immediately and the user is signed in straight away.
 */
export function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterInput>({
    initialValues: { accountType: 'STUDENT', fullName: '', email: '', universityId: '', department: '', phone: '', password: '', confirmPassword: '' },
    validate: {
      fullName: (v) => (v.trim().length >= 3 ? null : 'Enter your full name'),
      email: (v) => (/^\S+@\S+\.\S+$/.test(v.trim()) ? null : 'Enter a valid e-mail'),
      universityId: (v, values) => (values.accountType !== 'STUDENT' || /^[0-9A-Za-z-]{4,20}$/.test((v ?? '').trim()) ? null : 'Students must enter their university ID'),
      phone: (v) => (!v || /^[0-9+\-\s()]{6,25}$/.test(v) ? null : 'Digits, spaces, +, - or () only'),
      password: (v, values) => passwordError(v, values.email.trim()),
      confirmPassword: (v, values) => (v === values.password ? null : 'The passwords do not match'),
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const submit = form.onSubmit(async (values) => {
    setError(null);
    setLoading(true);
    try {
      const user = await register({
        ...values,
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        universityId: values.accountType === 'STUDENT' ? values.universityId?.trim() : undefined,
        department: values.department?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
      });
      notify.success(`Your account is ready. Welcome, ${user.fullName.split(' ')[0]}!`, 'Account created');
      // Teachers go straight to their profile to add their timetable and office hours.
      navigate(user.role === 'TEACHER' ? '/my-teacher-profile' : '/', { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  });

  return (
    <Center mih="100vh" bg="var(--mantine-color-gray-0)" p="md">
      <Paper withBorder shadow="md" radius="md" p="xl" w="100%" maw={560}>
        <Stack gap="lg">
          <Group gap="sm">
            <ThemeIcon size={44} radius="md">
              <IconBuildingCommunity size={26} />
            </ThemeIcon>
            <Box>
              <Title order={2}>Create an account</Title>
              <Text size="sm" c="dimmed">
                CampusOps – Smart Campus Facilities & Service Management
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
              <div>
                <Text size="sm" fw={500} mb={4}>
                  I am a
                </Text>
                <SegmentedControl
                  fullWidth
                  data={[
                    { value: 'STUDENT', label: 'Student' },
                    { value: 'TEACHER', label: 'Teacher' },
                    { value: 'STAFF', label: 'Staff member' },
                  ]}
                  {...form.getInputProps('accountType')}
                />
              </div>
              <TextInput label="Full name" required autoComplete="name" {...form.getInputProps('fullName')} />
              <TextInput label="E-mail" required autoComplete="email" placeholder="name@campusops.edu" {...form.getInputProps('email')} />
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                {form.values.accountType === 'STUDENT' && <TextInput label="University ID" required placeholder="0221234" {...form.getInputProps('universityId')} />}
                <TextInput label="Department / faculty" placeholder="Optional" {...form.getInputProps('department')} />
                <TextInput label="Phone" placeholder="Optional" autoComplete="tel" {...form.getInputProps('phone')} />
              </SimpleGrid>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <PasswordInput label="Password" required autoComplete="new-password" {...form.getInputProps('password')} />
                <PasswordInput label="Confirm password" required autoComplete="new-password" {...form.getInputProps('confirmPassword')} />
              </SimpleGrid>
              <PasswordChecklist password={form.values.password} email={form.values.email.trim()} />
              <Button type="submit" loading={loading} fullWidth mt="xs">
                Create account
              </Button>
            </Stack>
          </form>

          <Text size="sm" ta="center">
            Already have an account?{' '}
            <Anchor component={Link} to="/login">
              Sign in
            </Anchor>
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            Technicians, facility managers and administrators receive their accounts from the system administrator.
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
