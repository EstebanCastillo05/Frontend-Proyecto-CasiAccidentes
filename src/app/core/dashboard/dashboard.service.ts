import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import {
  AcceptedRejectedDatum,
  ApiResponse,
  BrigadeDatum,
  CorrectiveActionProgressDatum,
  DashboardSummary,
  StatusDatum,
  TimeByStageDatum,
} from './dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http
      .get<ApiResponse<DashboardSummary>>(`${API_BASE_URL}/dashboard/resumen`)
      .pipe(map((response) => response.data));
  }

  getAcceptedRejected(): Observable<AcceptedRejectedDatum[]> {
    return this.http
      .get<ApiResponse<AcceptedRejectedDatum[]>>(`${API_BASE_URL}/dashboard/aceptados-rechazados`)
      .pipe(map((response) => response.data));
  }

  getByStatus(): Observable<StatusDatum[]> {
    return this.http
      .get<ApiResponse<StatusDatum[]>>(`${API_BASE_URL}/dashboard/por-estado`)
      .pipe(map((response) => response.data));
  }

  getByBrigade(): Observable<BrigadeDatum[]> {
    return this.http
      .get<ApiResponse<BrigadeDatum[]>>(`${API_BASE_URL}/dashboard/por-brigada`)
      .pipe(map((response) => response.data));
  }

  getCorrectiveActionProgress(): Observable<CorrectiveActionProgressDatum[]> {
    return this.http
      .get<ApiResponse<CorrectiveActionProgressDatum[]>>(`${API_BASE_URL}/dashboard/avance-acciones`)
      .pipe(map((response) => response.data));
  }

  getTimeByStage(): Observable<TimeByStageDatum[]> {
    return this.http
      .get<ApiResponse<TimeByStageDatum[]>>(`${API_BASE_URL}/dashboard/tiempo-por-etapa`)
      .pipe(map((response) => response.data));
  }
}
