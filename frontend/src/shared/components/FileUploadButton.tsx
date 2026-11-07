import { Button, FileButton } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';

interface FileUploadButtonProps {
  onFiles: (files: File[]) => void;
  loading?: boolean;
  label?: string;
}

/** Picks up to 5 photos / PDFs (max 4 MB each, enforced by the API). */
export function FileUploadButton({ onFiles, loading, label = 'Upload files' }: FileUploadButtonProps) {
  return (
    <FileButton onChange={(files) => files.length > 0 && onFiles(files)} accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" multiple>
      {(props) => (
        <Button {...props} variant="light" size="xs" leftSection={<IconUpload size={14} />} loading={loading}>
          {label}
        </Button>
      )}
    </FileButton>
  );
}
