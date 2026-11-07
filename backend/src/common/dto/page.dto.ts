/** A page of results: items of the current page plus paging information. */
export class PageDto<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;

  static of<T>(content: T[], totalElements: number, page: number, size: number): PageDto<T> {
    const result = new PageDto<T>();
    result.content = content;
    result.page = page;
    result.size = size;
    result.totalElements = totalElements;
    result.totalPages = Math.max(1, Math.ceil(totalElements / size));
    return result;
  }

  map<R>(mapper: (item: T) => R): PageDto<R> {
    return PageDto.of(this.content.map(mapper), this.totalElements, this.page, this.size);
  }
}

/** Builds a Prisma "orderBy" from a whitelist, falling back to a default field. */
export function resolveSort<F extends string>(
  sortBy: string | undefined,
  sortDir: 'asc' | 'desc',
  allowed: readonly F[],
  fallback: F,
): Record<F, 'asc' | 'desc'> {
  const field = (allowed as readonly string[]).includes(sortBy ?? '') ? (sortBy as F) : fallback;
  return { [field]: sortDir } as Record<F, 'asc' | 'desc'>;
}
