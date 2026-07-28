import { HttpClient, HttpEvent } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import {
  Documento,
  DocumentoResponse,
  DocumentoListResponse
} from './documento.models';

@Injectable({
  providedIn: 'root'
})
export class DocumentoService {
  private readonly http = inject(HttpClient);

  subirDocumentos(formData: FormData): Observable<HttpEvent<DocumentoResponse>> {
    return this.http.post<DocumentoResponse>(
      `${API_BASE_URL}/documentos`,
      formData,
      {
        observe: 'events',
        reportProgress: true
      }
    );
  }

  obtenerPorCaso(idCaso: number): Observable<DocumentoListResponse> {
    return this.http.get<DocumentoListResponse>(
      `${API_BASE_URL}/documentos/caso/id/${idCaso}`
    );
  }

  buscarPorNumeroCaso(numero: string): Observable<DocumentoListResponse> {
    return this.http.get<DocumentoListResponse>(
      `${API_BASE_URL}/documentos/caso/numero/${numero}`
    );
  }

  obtenerUrl(id: number) {
    return this.http.get<{
      success: boolean;
      data: {
        url: string;
      };
    }>(
      `${API_BASE_URL}/documentos/${id}/url`
    );
  }
}