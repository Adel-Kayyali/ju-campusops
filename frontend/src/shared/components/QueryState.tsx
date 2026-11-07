import { Alert, Button, Center, Loader, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { errorMessage } from '@/api/apiError';

interface QueryStateProps<T> {
  query: { data: T | undefined; isLoading: boolean; isError: boolean; error: unknown; refetch: () => unknown };
  children: (data: T) => ReactNode;
}

/** Renders a loader, an error with retry, or the children with the loaded data. */
export function QueryState<T>({ query, children }: QueryStateProps<T>) {
  if (query.isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }
  if (query.isError || query.data === undefined) {
    return (
      <Alert color="red" icon={<IconAlertTriangle size={18} />} title="Could not load the data">
        <Stack gap="xs" align="flex-start">
          <Text size="sm">{errorMessage(query.error)}</Text>
          <Button size="xs" variant="light" color="red" onClick={() => query.refetch()}>
            Try again
          </Button>
        </Stack>
      </Alert>
    );
  }
  return <>{children(query.data)}</>;
}
