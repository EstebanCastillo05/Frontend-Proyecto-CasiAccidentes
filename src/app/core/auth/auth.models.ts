export interface AuthUser {
  id_usuario: number;
  id_rol: number;
  nombre: string;
  correo: string;
  rol: string;
}

export interface AuthResponse {
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
}
