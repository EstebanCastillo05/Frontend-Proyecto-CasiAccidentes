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
