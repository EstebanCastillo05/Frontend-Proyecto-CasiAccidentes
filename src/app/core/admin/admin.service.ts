import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import {
  ApiResponse,
  Brigada,
  BrigadaCatalogos,
  CreateBrigadaRequest,
  CreateUserRequest,
  Role,
  UpdateBrigadaRequest,
  UpdateUserRequest,
  User,
} from './admin.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http
      .get<ApiResponse<User[]>>(`${API_BASE_URL}/usuarios`)
      .pipe(map((response) => response.data));
  }

  createUser(data: CreateUserRequest): Observable<User> {
    return this.http
      .post<ApiResponse<User>>(`${API_BASE_URL}/usuarios`, data)
      .pipe(map((response) => response.data));
  }

  updateUser(id: number, data: UpdateUserRequest): Observable<User> {
    return this.http
      .put<ApiResponse<User>>(`${API_BASE_URL}/usuarios/${id}`, data)
      .pipe(map((response) => response.data));
  }

  deleteUser(id: number): Observable<User> {
    return this.http
      .delete<ApiResponse<User>>(`${API_BASE_URL}/usuarios/${id}`)
      .pipe(map((response) => response.data));
  }

  getRoles(): Observable<Role[]> {
    return this.http
      .get<ApiResponse<Role[]>>(`${API_BASE_URL}/roles`)
      .pipe(map((response) => response.data));
  }

  getBrigadas(): Observable<Brigada[]> {
    return this.http
      .get<ApiResponse<Brigada[]>>(`${API_BASE_URL}/brigadas`)
      .pipe(map((response) => response.data));
  }

  getBrigadaCatalogos(): Observable<BrigadaCatalogos> {
    return this.http
      .get<ApiResponse<BrigadaCatalogos>>(`${API_BASE_URL}/brigadas/catalogos`)
      .pipe(map((response) => response.data));
  }

  createBrigada(data: CreateBrigadaRequest): Observable<Brigada> {
    return this.http
      .post<ApiResponse<Brigada>>(`${API_BASE_URL}/brigadas`, data)
      .pipe(map((response) => response.data));
  }

  updateBrigada(id: number, data: UpdateBrigadaRequest): Observable<Brigada> {
    return this.http
      .put<ApiResponse<Brigada>>(`${API_BASE_URL}/brigadas/${id}`, data)
      .pipe(map((response) => response.data));
  }

  deleteBrigada(id: number): Observable<Brigada> {
    return this.http
      .delete<ApiResponse<Brigada>>(`${API_BASE_URL}/brigadas/${id}`)
      .pipe(map((response) => response.data));
  }
}
