import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthService } from '../../core/auth/auth.service';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  rolesPermitidos: string[];
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
      rolesPermitidos: ['Admin', 'Brigada', 'PRL Contratista', 'Responsable del Proceso', 'Gestor SYMA', 'Control SYMA'],
    },
    {
      label: 'Gestion de Casos',
      route: '/casos',
      icon: 'folder_open',
      rolesPermitidos: ['Admin', 'Brigada', 'Responsable del Proceso', 'Gestor SYMA', 'Control SYMA'],
    },
    {
      label: 'Acciones Correctivas',
      route: '/acciones',
      icon: 'task_alt',
      rolesPermitidos: ['Admin', 'Responsable del Proceso', 'Gestor SYMA'],
    },
    {
      label: 'Gestion Documental',
      route: '/documentos',
      icon: 'description',
      rolesPermitidos: ['Admin', 'Gestor SYMA', 'Control SYMA'],
    },
    {
      label: 'Bitacora e Historial',
      route: '/bitacora',
      icon: 'history',
      rolesPermitidos: ['Admin', 'Control SYMA'],
    },
    {
      label: 'Administracion',
      route: '/admin/usuarios',
      icon: 'settings',
      rolesPermitidos: ['Admin'],
    },
  ];

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
