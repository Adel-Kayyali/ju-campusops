/** A file received from an HTTP upload. */
export interface IncomingFile {
  originalName: string;
  contentType: string;
  sizeBytes: number;
  buffer: Buffer;
}

export interface StoredFile {
  url: string;
}

/**
 * Port (abstraction) for binary file storage. The concrete adapter is chosen by
 * configuration (Strategy pattern): local disk for development, Vercel Blob in production.
 */
export abstract class FileStorage {
  abstract save(file: IncomingFile, folder: string): Promise<StoredFile>;
}

export function buildStorageKey(folder: string, originalName: string): string {
  const safeName = originalName.toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-').slice(-80);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${folder}/${unique}-${safeName}`;
}
