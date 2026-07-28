import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import {
  AcceptedRejectedDatum,
  ApiResponse,
  BrigadeDatum,
  CorrectiveActionProgressDatum,
  DashboardFilterOptions,
  DashboardFilters,
  DashboardSummary,
  MonthlyByStageDatum,
  ProcessDatum,
  StageFlowDatum,
  StatusDatum,
  TimeByStageDatum,
} from './dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  getSummary(filters?: DashboardFilters): Observable<DashboardSummary> {
    return this.http
      .get<ApiResponse<DashboardSummary>>(`${API_BASE_URL}/dashboard/resumen`, {
        params: this.buildParams(filters),
      })
      .pipe(map((response) => response.data));
  }

  getAcceptedRejected(filters?: DashboardFilters): Observable<AcceptedRejectedDatum[]> {
    return this.http
      .get<ApiResponse<AcceptedRejectedDatum[]>>(`${API_BASE_URL}/dashboard/aceptados-rechazados`, {
        params: this.buildParams(filters),
      })
      .pipe(map((response) => response.data));
  }

  getByStatus(filters?: DashboardFilters): Observable<StatusDatum[]> {
    return this.http
      .get<ApiResponse<StatusDatum[]>>(`${API_BASE_URL}/dashboard/por-estado`, {
        params: this.buildParams(filters),
      })
      .pipe(map((response) => response.data));
  }

  getByBrigade(filters?: DashboardFilters): Observable<BrigadeDatum[]> {
    return this.http
      .get<ApiResponse<BrigadeDatum[]>>(`${API_BASE_URL}/dashboard/por-brigada`, {
        params: this.buildParams(filters),
      })
      .pipe(map((response) => response.data));
  }

  getByProcess(filters?: DashboardFilters): Observable<ProcessDatum[]> {
    return this.http
      .get<ApiResponse<ProcessDatum[]>>(`${API_BASE_URL}/dashboard/por-proceso`, {
        params: this.buildParams(filters),
      })
      .pipe(map((response) => response.data));
  }

  getStageFlow(filters?: DashboardFilters): Observable<StageFlowDatum[]> {
    return this.http
      .get<ApiResponse<StageFlowDatum[]>>(`${API_BASE_URL}/dashboard/flujo-etapas`, {
        params: this.buildParams(filters),
      })
      .pipe(map((response) => response.data));
  }

  getCorrectiveActionProgress(filters?: DashboardFilters): Observable<CorrectiveActionProgressDatum[]> {
    return this.http
      .get<ApiResponse<CorrectiveActionProgressDatum[]>>(`${API_BASE_URL}/dashboard/avance-acciones`, {
        params: this.buildParams(filters),
      })
      .pipe(map((response) => response.data));
  }

  getTimeByStage(filters?: DashboardFilters): Observable<TimeByStageDatum[]> {
    return this.http
      .get<ApiResponse<TimeByStageDatum[]>>(`${API_BASE_URL}/dashboard/tiempo-por-etapa`, {
        params: this.buildParams(filters),
      })
      .pipe(map((response) => response.data));
  }

  getMonthlyByStage(filters?: DashboardFilters): Observable<MonthlyByStageDatum[]> {
    return this.http
      .get<ApiResponse<MonthlyByStageDatum[]>>(`${API_BASE_URL}/dashboard/reportes-mensuales`, {
        params: this.buildParams(filters),
      })
      .pipe(map((response) => response.data));
  }

  getFilterOptions(): Observable<DashboardFilterOptions> {
    return this.http
      .get<ApiResponse<DashboardFilterOptions>>(`${API_BASE_URL}/dashboard/filtros`)
      .pipe(map((response) => response.data));
  }

  private buildParams(filters: DashboardFilters = {}): HttpParams {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return params;
  }
}
