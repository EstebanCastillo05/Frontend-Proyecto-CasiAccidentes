import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import {
  ApiListResponse,
  ApiResponse,
  Brigada,
  Caso,
  CasoFilters,
  Catalogo,
  CreateCasoRequest,
  UpdateCasoRequest,
} from './caso.models';

@Injectable({ providedIn: 'root' })
export class CasoService {
  constructor(private readonly http: HttpClient) {}

  getCasos(filters: CasoFilters = {}): Observable<Caso[]> {
    let params = new HttpParams();
    if (filters.id_region) params = params.set('id_region', filters.id_region);
    if (filters.id_estado) params = params.set('id_estado', filters.id_estado);

    return this.http
      .get<ApiListResponse<Caso>>(`${API_BASE_URL}/casos`, { params })
      .pipe(map((response) => response.data));
  }

  getCaso(id: number): Observable<Caso> {
    return this.http
      .get<ApiResponse<Caso>>(`${API_BASE_URL}/casos/${id}`)
      .pipe(map((response) => response.data));
  }

  createCaso(data: CreateCasoRequest): Observable<Caso> {
    return this.http
      .post<ApiResponse<Caso>>(`${API_BASE_URL}/casos`, data)
      .pipe(map((response) => response.data));
  }

  updateCaso(id: number, data: UpdateCasoRequest): Observable<Caso> {
    return this.http
      .put<ApiResponse<Caso>>(`${API_BASE_URL}/casos/${id}`, data)
      .pipe(map((response) => response.data));
  }

  anularCaso(id: number, motivo: string): Observable<Caso> {
    return this.http
      .delete<ApiResponse<Caso>>(`${API_BASE_URL}/casos/${id}`, { body: { motivo } })
      .pipe(map((response) => response.data));
  }

  // Catalogos auxiliares para el formulario. Se traen completos y se filtran en cliente.
  getBrigadas(): Observable<Brigada[]> {
    return this.http
      .get<ApiListResponse<Brigada>>(`${API_BASE_URL}/brigadas`)
      .pipe(map((response) => response.data));
  }

  getRegiones(): Observable<Catalogo[]> {
    return this.http
      .get<ApiListResponse<Catalogo>>(`${API_BASE_URL}/regiones`)
      .pipe(map((response) => response.data));
  }

  getEstados(): Observable<Catalogo[]> {
    return this.http
      .get<ApiListResponse<Catalogo>>(`${API_BASE_URL}/estados`)
      .pipe(map((response) => response.data));
  }

  getContratistas(): Observable<Catalogo[]> {
  return this.http
    .get<ApiListResponse<Catalogo>>(`${API_BASE_URL}/contratistas`)
    .pipe(map((response) => response.data));
  }
}