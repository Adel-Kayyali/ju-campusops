import { Loader, Select } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useState } from 'react';
import { useUsers } from './api';

interface StudentPickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
  error?: string;
}

/** Searchable select that queries active students by name or university ID. */
export function StudentPicker({ value, onChange, error }: StudentPickerProps) {
  const [search, setSearch] = useState('');
  const [debounced] = useDebouncedValue(search, 300);
  const students = useUsers({ role: 'STUDENT', isActive: true, search: debounced, size: 20 });
  const options = (students.data?.content ?? []).map((s) => ({ value: s.id, label: `${s.fullName} (${s.universityId ?? s.email})` }));

  return (
    <Select
      label="Student"
      placeholder="Search by name or university ID"
      searchable
      required
      data={options}
      value={value}
      onChange={onChange}
      searchValue={search}
      onSearchChange={setSearch}
      filter={({ options: all }) => all}
      nothingFoundMessage={students.isFetching ? 'Searching…' : 'No student found'}
      rightSection={students.isFetching ? <Loader size={14} /> : undefined}
      error={error}
    />
  );
}
