import { Alert, Button, Checkbox, FileInput, Group, Paper, Select, SimpleGrid, Stack, Textarea, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertTriangle, IconPhoto } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { buildingOptions, useBuildings, useRooms } from '@/features/locations/api';
import { PageHeader } from '@/shared/components/PageHeader';
import { CONTACT_METHODS, REQUEST_CATEGORIES, SEVERITIES, URGENCIES, type ContactMethod, type RequestCategory, type Severity, type Urgency } from '@/shared/types/enums';
import { toOptions } from '@/shared/utils/labels';
import { notify } from '@/shared/utils/notify';
import { requestsApi, useAssetsInBuilding, useRequestMutation } from '../api';
import type { CreateRequestInput } from '../types';

interface FormValues {
  title: string;
  description: string;
  category: RequestCategory | null;
  severity: Severity;
  urgency: Urgency;
  isSafetyRelated: boolean;
  buildingId: string | null;
  roomId: string | null;
  assetId: string | null;
  locationDetails: string;
  preferredContact: ContactMethod;
  contactDetail: string;
}

const MAX_FILES = 5;

/** Report a facility problem, optionally with photos. */
export function NewRequestPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const form = useForm<FormValues>({
    initialValues: {
      title: '',
      description: '',
      category: null,
      severity: 'MEDIUM',
      urgency: 'MEDIUM',
      isSafetyRelated: false,
      buildingId: null,
      roomId: null,
      assetId: null,
      locationDetails: '',
      preferredContact: 'IN_APP',
      contactDetail: '',
    },
    validate: {
      title: (v) => (v.trim().length >= 5 ? null : 'At least 5 characters'),
      description: (v) => (v.trim().length >= 10 ? null : 'Describe the problem (at least 10 characters)'),
      category: (v) => (v ? null : 'Choose a category'),
      buildingId: (v) => (v ? null : 'Choose a building'),
      contactDetail: (v, values) => (values.preferredContact !== 'IN_APP' && !v.trim() ? 'Enter your email or phone number' : null),
    },
  });

  const buildings = useBuildings();
  const rooms = useRooms(form.values.buildingId);
  const assets = useAssetsInBuilding(form.values.buildingId);

  const submit = useRequestMutation(async (values: FormValues) => {
    const input: CreateRequestInput = {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category!,
      severity: values.severity,
      urgency: values.urgency,
      isSafetyRelated: values.isSafetyRelated,
      buildingId: values.buildingId!,
      roomId: values.roomId ?? undefined,
      assetId: values.assetId ?? undefined,
      locationDetails: values.locationDetails.trim() || undefined,
      preferredContact: values.preferredContact,
      contactDetail: values.contactDetail.trim() || undefined,
    };
    const created = await requestsApi.create(input);
    if (files.length > 0) {
      try {
        await requestsApi.upload(created.id, files);
      } catch (error) {
        notify.warning(error, 'The request was created, but the photos could not be uploaded');
      }
    }
    return created;
  });

  const onBuildingChange = (buildingId: string | null) => {
    form.setValues({ buildingId, roomId: null, assetId: null });
  };

  return (
    <>
      <PageHeader title="Report a problem" description="Describe the issue and where it is. You can follow its progress afterwards." />
      <Paper withBorder radius="md" p="lg" maw={900}>
        <form
          onSubmit={form.onSubmit((values) =>
            submit.mutate(values, {
              onSuccess: (created) => {
                notify.success(`Request ${created.code} submitted with priority ${created.priority}`);
                navigate(`/requests/${created.id}`);
              },
              onError: (error) => notify.error(error),
            }),
          )}
        >
          <Stack>
            <Title order={5}>What is the problem?</Title>
            <TextInput label="Title" placeholder="e.g. Air conditioning not cooling in Lab 1" required {...form.getInputProps('title')} />
            <Textarea label="Description" autosize minRows={4} required {...form.getInputProps('description')} />
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <Select label="Category" required data={toOptions(REQUEST_CATEGORIES)} {...form.getInputProps('category')} />
              <Select label="Impact (severity)" allowDeselect={false} data={toOptions(SEVERITIES)} {...form.getInputProps('severity')} />
              <Select label="Urgency" allowDeselect={false} data={toOptions(URGENCIES)} {...form.getInputProps('urgency')} />
            </SimpleGrid>
            <Checkbox label="This is a safety risk (people could get hurt)" {...form.getInputProps('isSafetyRelated', { type: 'checkbox' })} />
            {form.values.isSafetyRelated && (
              <Alert color="red" icon={<IconAlertTriangle size={16} />} variant="light">
                Safety-related requests get a high priority. In an emergency, also call campus security.
              </Alert>
            )}

            <Title order={5} mt="sm">
              Where is it?
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <Select label="Building" required searchable data={buildingOptions(buildings.data)} value={form.values.buildingId} onChange={onBuildingChange} error={form.errors.buildingId} />
              <Select
                label="Room"
                placeholder={form.values.buildingId ? 'Optional' : 'Choose a building first'}
                clearable
                searchable
                disabled={!form.values.buildingId}
                data={(rooms.data ?? []).map((r) => ({ value: r.id, label: `${r.code} – ${r.name}` }))}
                {...form.getInputProps('roomId')}
              />
              <Select
                label="Equipment (asset)"
                placeholder={form.values.buildingId ? 'Optional' : 'Choose a building first'}
                clearable
                searchable
                disabled={!form.values.buildingId}
                data={(assets.data?.content ?? []).map((a) => ({ value: a.id, label: `${a.code} – ${a.name}` }))}
                {...form.getInputProps('assetId')}
              />
            </SimpleGrid>
            <TextInput label="Location details" placeholder="e.g. near the north stairs" {...form.getInputProps('locationDetails')} />

            <Title order={5} mt="sm">
              How can we reach you?
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Select label="Preferred contact" allowDeselect={false} data={toOptions(CONTACT_METHODS)} {...form.getInputProps('preferredContact')} />
              <TextInput label="Email / phone" disabled={form.values.preferredContact === 'IN_APP'} {...form.getInputProps('contactDetail')} />
            </SimpleGrid>

            <FileInput
              label="Photos (optional)"
              description="Up to 5 images or PDFs, 4 MB each"
              placeholder="Attach photos of the problem"
              multiple
              clearable
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
              leftSection={<IconPhoto size={16} />}
              value={files}
              onChange={(value) => setFiles(value.slice(0, MAX_FILES))}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" loading={submit.isPending}>
                Submit request
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </>
  );
}
