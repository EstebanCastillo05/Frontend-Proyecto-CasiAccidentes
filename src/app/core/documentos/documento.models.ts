export interface Documento {
  id_documento: number;
  id_casi_accidente: number;
  id_tipo_documento: number;
  id_accion_correctiva?: number | null;
  nombre_archivo: string;
  ruta_archivo: string;
  descripcion?: string | null;
  version: number;
  id_usuario_subio: number;
  subido_en: string;
  tipos_documento?: {
    id_tipo_documento: number;
    nombre: string;
  };

  usuarios?: {
    id_usuario: number;
    nombre: string;
    correo: string;
  };
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
  data: Documento;
}

export interface DocumentoListResponse {
  success: boolean;
  data: Documento[];
}