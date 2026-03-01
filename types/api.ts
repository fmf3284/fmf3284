export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  role?: 'user' | 'admin' | 'moderator';
  isActive?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
  code?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role?: 'user' | 'admin' | 'moderator';
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  password?: string;
  role?: 'user' | 'admin' | 'moderator';
  isActive?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export interface FilterParams {
  search?: string;
  role?: string;
  isActive?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

export type ApiResponse<T> = T | ApiError;

export interface RequestConfig extends Omit<RequestInit, 'cache'> {
  headers?: Record<string, string>;
  timeout?: number;
}
