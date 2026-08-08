export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface ApiListResponse<T> {
  message: string;
  data: T[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export interface HistorialEstadoItem {
  fecha: string | Date;
  estado: string;
  usuario?: string;
  comentario?: string;
  icono?: string;
}

export interface UsuarioAsignado {
  id_usuario: number;
  nombre: string | null;
  correo: string | null;
}

export interface BrigadaAsignacion {
  id_asignacion: number;
  id_usuario_prl: number | null;
  id_usuario_responsable: number | null;
  usuarios_prl?: UsuarioAsignado | null;
  usuarios_responsable?: UsuarioAsignado | null;
}

export interface Brigada {
  id_brigada: number;
  nombre: string | null;
  id_region: number | null;
  id_proceso: number | null;
  id_contratista: number | null;
  activo: boolean | null;
  regiones?: Catalogo | null;
  procesos?: Catalogo | null;
  contratistas?: Catalogo | null;
  // El backend incluye la asignación activa (PRL + Responsable) como arreglo de 1 elemento o vacío
  brigada_asignacion?: BrigadaAsignacion[];
}

export interface Catalogo {
  id_region?: number;
  id_proceso?: number;
  id_contratista?: number;
  nombre: string | null;
  descripcion?: string | null;
  activo: boolean | null;
}

export interface Estado {
  id_estado: number;
  nombre: string | null;
  descripcion: string | null;
  orden: number | null;
  activo: boolean | null;
}

export interface Caso {
  id_casi_accidente: number;
  numero_caso: string | null;
  titulo: string | null;
  descripcion: string | null;
  fecha_reporte: string | null;
  id_region: number | null;
  id_proceso: number | null;
  id_brigada: number | null;
  id_contratista: number | null;
  id_estado: number | null;
  creado_en: string | null;
  actualizado_en: string | null;
  regiones: Catalogo | null;
  procesos: Catalogo | null;
  brigadas: Brigada | null;
  contratistas: Catalogo | null;
  estados: Estado | null;
  historial_estados?: HistorialEstadoItem[];
}

export interface CreateCasoRequest {
  titulo: string;
  descripcion: string;
  id_brigada: number;
  id_proceso: number;
}

export interface UpdateCasoRequest {
  titulo?: string;
  descripcion?: string;
  id_brigada?: number;
  id_proceso?: number;
}

export interface CasoFilters {
  id_region?: number;
  id_estado?: number;
  id_brigada?: number;
}