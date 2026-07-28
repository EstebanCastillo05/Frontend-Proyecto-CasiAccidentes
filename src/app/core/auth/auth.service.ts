import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { AuthResponse, AuthUser } from './auth.models';
import {
  ROL_ADMINISTRADOR,
  ROL_BRIGADA,
  ROL_PRL_CONTRATISTA,
  ROL_RESPONSABLE_PROCESO,
  ROL_GESTOR_SYMA,
  ROL_GESTION_CONTROL_SYMA
} from './roles.constants';

const TOKEN_KEY = 'casi_accidentes_token';
const USER_KEY = 'casi_accidentes_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userState = signal<AuthUser | null>(this.getStoredUser());
  readonly currentUser = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.getToken()));

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  login(correo: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/login`, { correo, password })
      .pipe(
        tap((response) => {
          localStorage.setItem(TOKEN_KEY, response.data.token);
          localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
          this.userState.set(response.data.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userState.set(null);
    this.router.navigateByUrl('/login');
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get userRoleId(): number | null {
    const user = this.currentUser();
    return user ? user.id_rol : null;
  }

  isAdmin(): boolean {
    return this.userRoleId === ROL_ADMINISTRADOR;
  }

  isGestionControlSyma(): boolean {
    return this.userRoleId === ROL_GESTION_CONTROL_SYMA;
  }

  isPrlContratista(): boolean {
    return this.userRoleId === ROL_PRL_CONTRATISTA;
  }

  isBrigada(): boolean {
    return this.userRoleId === ROL_BRIGADA;
  }

  isGestorSyma(): boolean {
    return this.userRoleId === ROL_GESTOR_SYMA;
  }

  isResponsableProceso(): boolean {
    return this.userRoleId === ROL_RESPONSABLE_PROCESO;
  }

  canSeeAdministration(): boolean {
    return this.isAdmin();
  }

  canSeeBitacora(): boolean {
    return this.isAdmin() || this.isGestionControlSyma();
  }

  seesAllCases(): boolean {
    return this.isAdmin() || this.isGestionControlSyma();
  }

  private getStoredUser(): AuthUser | null {
    const storedUser = localStorage.getItem(USER_KEY);
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}