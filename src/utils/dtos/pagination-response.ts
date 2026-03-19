export interface PaginationResponse<T> {
    nextCursor: number | null;
    isLast: boolean;
    data: T[];
}
