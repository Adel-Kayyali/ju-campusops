import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router';

export function ForbiddenPage() {
  return (
    <Center py={80}>
      <Stack align="center">
        <Title order={2}>Access denied</Title>
        <Text c="dimmed">Your role does not have access to this page.</Text>
        <Button component={Link} to="/">
          Back to dashboard
        </Button>
      </Stack>
    </Center>
  );
}
