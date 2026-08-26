import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { ApiResponse, HistorialEstadoItem } from '../casos/caso.models';

export interface HistorialListResponse {
  success: boolean;
  data: HistorialEstadoItem[];
  caso?: {
    id_casi_accidente: number;
    numero_caso: string | null;
    titulo: string | null;
  };
}

@Injectable({ providedIn: 'root' })
export class BitacoraService {
  private readonly http = inject(HttpClient);

  buscarPorNumeroCaso(numeroCaso: string): Observable<HistorialListResponse> {
    return this.http.get<HistorialListResponse>(
      `${API_BASE_URL}/historial/caso/numero/${encodeURIComponent(numeroCaso.trim())}`
    );
  }

  obtenerPorCaso(idCaso: number): Observable<HistorialEstadoItem[]> {
    // Para modo embebido se reutiliza GET /api/casos/:id, que ya devuelve
    // historial_estados mapeado y evita duplicar otro endpoint por id.
    return this.http.get<ApiResponse<{ historial_estados?: HistorialEstadoItem[] }>>(
      `${API_BASE_URL}/casos/${idCaso}`
    ).pipe(map((response) => response.data.historial_estados || []));
  }
}