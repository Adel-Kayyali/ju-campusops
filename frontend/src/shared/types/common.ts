/** Small reference objects embedded in many API responses. */
export interface BuildingRef {
  id: string;
  code: string;
  name: string;
}

export interface RoomRef {
  id: string;
  code: string;
  name: string;
}

export interface UserRef {
  id: string;
  fullName: string;
  universityId: string | null;
  email?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
}
