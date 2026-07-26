export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface Role {
  id_rol: number;
  nombre: string | null;
  descripcion?: string | null;
  activo: boolean | null;
}

export interface UserRole {
  id_usuario_rol: number;
  id_usuario: number | null;
  id_rol: number | null;
  roles: Role | null;
}

export interface User {
  id_usuario: number;
  nombre: string | null;
  correo: string | null;
  activo: boolean | null;
  creado_en: string | null;
  usuario_roles: UserRole[];
}

export interface CreateUserRequest {
  nombre: string;
  correo: string;
  password: string;
  id_rol: number;
}

export interface UpdateUserRequest {
  nombre?: string;
  correo?: string;
  password?: string;
  id_rol?: number;
  activo?: boolean;
}

export interface Region {
  id_region: number;
  nombre: string | null;
  descripcion?: string | null;
  activo: boolean | null;
}

export interface Proceso {
  id_proceso: number;
  nombre: string | null;
  descripcion?: string | null;
  activo: boolean | null;
}

export interface Contratista {
  id_contratista: number;
  nombre: string | null;
  correo?: string | null;
  telefono?: string | null;
  activo: boolean | null;
}

export interface Brigada {
  id_brigada: number;
  nombre: string | null;
  id_region: number | null;
  id_proceso: number | null;
  id_contratista: number | null;
  activo: boolean | null;
  regiones?: Region | null;
  procesos?: Proceso | null;
  contratistas?: Contratista | null;
}

export interface BrigadaCatalogos {
  regiones: Region[];
  procesos: Proceso[];
  contratistas: Contratista[];
}

export interface CreateBrigadaRequest {
  nombre: string;
  id_region: number | null;
  id_proceso: number | null;
  id_contratista: number | null;
  activo: boolean;
}

export interface UpdateBrigadaRequest {
  nombre?: string;
  id_region?: number | null;
  id_proceso?: number | null;
  id_contratista?: number | null;
  activo?: boolean;
}
