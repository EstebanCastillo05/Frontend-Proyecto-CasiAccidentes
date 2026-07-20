import { HttpClient, HttpEvent } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { Documento, DocumentoResponse } from './documento.models';

@Injectable({ providedIn: 'root' })
export class DocumentoService {
  private readonly http = inject(HttpClient);

  subirDocumento(formData: FormData): Observable<HttpEvent<DocumentoResponse>> {
    return this.http.post<DocumentoResponse>(`${API_BASE_URL}/documentos`, formData, {
      observe: 'events',
      reportProgress: true,
    });
  }

  obtenerPorCaso(idCaso: number): Observable<Documento[]> {
    return this.http.get<Documento[]>(`${API_BASE_URL}/documentos/caso/${idCaso}`);
  }

  descargar(idDocumento: number): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/documentos/${idDocumento}/download`, {
      responseType: 'blob',
    });
  }

  visualizar(idDocumento: number): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/documentos/${idDocumento}/view`, {
      responseType: 'blob',
    });
  }
}
