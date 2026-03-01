export interface PaginationResponse<T> {
    total: number;
    isLast: boolean;
    page: number;
    data: T[];
}
