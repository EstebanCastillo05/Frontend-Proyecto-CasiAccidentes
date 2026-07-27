import { Component, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthService } from '../../core/auth/auth.service';
import {
  ROL_ADMINISTRADOR, ROL_BRIGADA, ROL_PRL_CONTRATISTA,
  ROL_RESPONSABLE_PROCESO, ROL_GESTOR_SYMA, ROL_GESTION_CONTROL_SYMA,
} from '../../core/auth/roles.constants';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  rolesPermitidos: number[];
}

const TODOS = [
  ROL_ADMINISTRADOR, ROL_BRIGADA, ROL_PRL_CONTRATISTA,
  ROL_RESPONSABLE_PROCESO, ROL_GESTOR_SYMA, ROL_GESTION_CONTROL_SYMA,
];

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  private readonly allMenuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard', rolesPermitidos: TODOS },
    { label: 'Gestion de Casos', route: '/casos', icon: 'folder_open', rolesPermitidos: TODOS },
    { label: 'Acciones Correctivas', route: '/acciones', icon: 'task_alt',
      rolesPermitidos: [ROL_ADMINISTRADOR, ROL_PRL_CONTRATISTA, ROL_GESTOR_SYMA] },
    { label: 'Gestion Documental', route: '/documentos', icon: 'description',
      rolesPermitidos: [ROL_ADMINISTRADOR, ROL_PRL_CONTRATISTA, ROL_GESTOR_SYMA, ROL_GESTION_CONTROL_SYMA] },
    { label: 'Bitacora e Historial', route: '/bitacora', icon: 'history',
      rolesPermitidos: [ROL_ADMINISTRADOR, ROL_GESTION_CONTROL_SYMA] },
    { label: 'Administracion', route: '/admin/usuarios', icon: 'settings', rolesPermitidos: [ROL_ADMINISTRADOR] },
  ];

  readonly menuItems = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.allMenuItems.filter((item) => item.rolesPermitidos.includes(user.id_rol));
  });

  readonly esVisitantePublico = computed(() => !this.authService.currentUser());

  constructor(
    readonly authService: AuthService,
    private readonly router: Router
  ) {}

  isLoginPage(): boolean {
    return this.router.url.startsWith('/login');
  }

  logout(): void {
    this.authService.logout();
  }
}