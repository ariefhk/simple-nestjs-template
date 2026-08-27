export interface PaginatedResult<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
}
