/* eslint-disable prettier/prettier */
import { User } from './user.entity';

export interface Users {
  data: User[];
  currentPage: number;
  size: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface PaginationPayload {
  page?: number;
  limit?: number;
}
