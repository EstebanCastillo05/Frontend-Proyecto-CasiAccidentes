export interface Documento {
  id_documento: number;
  nombre_archivo: string;
  version: number;
  descripcion?: string | null;
  subido_en?: string | null;
  tipo_documento?: string | null;
  ruta_archivo?: string | null;
  usuario?: string | null;
}

export interface DocumentoUpload {
  archivo: File;
  idCaso: number;
  idTipoDocumento: number;
  descripcion: string;
}

export interface DocumentoResponse {
  success: boolean;
  message: string;
  data: {
    id_documento: number;
    nombre_archivo: string;
    ruta_archivo: string;
    version: number;
  };
}
