import { Group, Stack, Text } from '@mantine/core';
import { IconCircleCheck, IconCircleDashed } from '@tabler/icons-react';
import { PASSWORD_RULES } from './passwordPolicy';

/** Live list of the password rules, ticked as the user types. */
export function PasswordChecklist({ password, email = '' }: { password: string; email?: string }) {
  return (
    <Stack gap={2}>
      {PASSWORD_RULES.map((rule) => {
        const ok = password.length > 0 && rule.test(password, email);
        return (
          <Group key={rule.code} gap={6} wrap="nowrap">
            {ok ? <IconCircleCheck size={15} color="var(--mantine-color-green-6)" /> : <IconCircleDashed size={15} color="var(--mantine-color-gray-5)" />}
            <Text size="xs" c={ok ? 'green.7' : 'dimmed'}>
              {rule.label}
            </Text>
          </Group>
        );
      })}
    </Stack>
  );
}
