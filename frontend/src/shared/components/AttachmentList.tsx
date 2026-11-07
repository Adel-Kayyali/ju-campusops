import { Anchor, Group, Image, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconFileTypePdf } from '@tabler/icons-react';
import type { Attachment } from '@/shared/types/common';
import { formatBytes } from '@/shared/utils/format';

export function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  if (attachments.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No files attached.
      </Text>
    );
  }
  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
      {attachments.map((file) => (
        <Paper key={file.id} withBorder radius="sm" p={6} component="a" href={file.url} target="_blank" rel="noreferrer">
          <Stack gap={4}>
            {file.contentType.startsWith('image/') ? (
              <Image src={file.url} alt={file.fileName} h={90} fit="cover" radius="xs" fallbackSrc="https://placehold.co/160x90?text=Image" />
            ) : (
              <Group h={90} justify="center">
                <IconFileTypePdf size={40} />
              </Group>
            )}
            <Anchor component="span" size="xs" lineClamp={1}>
              {file.fileName}
            </Anchor>
            <Text size="xs" c="dimmed">
              {formatBytes(file.sizeBytes)}
            </Text>
          </Stack>
        </Paper>
      ))}
    </SimpleGrid>
  );
}
