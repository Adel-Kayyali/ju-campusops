import { useQuery } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import type { RoomType } from '@/shared/types/enums';

export interface Building {
  id: string;
  code: string;
  name: string;
  campus: string;
  floors: number;
  roomCount: number;
  lockerCount: number;
  assetCount: number;
}

export interface Room {
  id: string;
  buildingId: string;
  code: string;
  name: string;
  floor: number;
  type: RoomType;
}

export const locationKeys = {
  buildings: ['buildings'] as const,
  rooms: (buildingId: string) => ['buildings', buildingId, 'rooms'] as const,
};

export const locationsApi = {
  buildings: () => http.get<Building[]>('/buildings'),
  rooms: (buildingId: string) => http.get<Room[]>(`/buildings/${buildingId}/rooms`),
};

/** Buildings rarely change: cached for 10 minutes. */
export function useBuildings() {
  return useQuery({ queryKey: locationKeys.buildings, queryFn: locationsApi.buildings, staleTime: 10 * 60_000 });
}

export function useRooms(buildingId: string | null | undefined) {
  return useQuery({
    queryKey: locationKeys.rooms(buildingId ?? ''),
    queryFn: () => locationsApi.rooms(buildingId!),
    enabled: Boolean(buildingId),
    staleTime: 10 * 60_000,
  });
}

export function buildingOptions(buildings: Building[] | undefined): { value: string; label: string }[] {
  return (buildings ?? []).map((b) => ({ value: b.id, label: `${b.code} – ${b.name}` }));
}
