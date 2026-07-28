import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatBadgeModule } from '@angular/material/badge';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { CasoService } from '../../core/casos/caso.service';
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
  imports: [
    CommonModule,
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    MatSidenavModule, 
    MatListModule, 
    MatIconModule, 
    MatButtonModule, 
    MatBadgeModule
  ],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit {
  private readonly casoService = inject(CasoService);
  
  readonly badgeAcciones = signal<number>(0);
  readonly rolUsuario = computed(() => {
    const user = this.authService.currentUser();

    switch (user?.id_rol) {
      case ROL_ADMINISTRADOR:
        return 'Administrador';
      case ROL_BRIGADA:
        return 'Brigada';
      case ROL_PRL_CONTRATISTA:
        return 'PRL Contratista';
      case ROL_RESPONSABLE_PROCESO:
        return 'Responsable de proceso';
      case ROL_GESTOR_SYMA:
        return 'Gestor SYMA';
      case ROL_GESTION_CONTROL_SYMA:
        return 'Gestion y Control SYMA';
      default:
        return 'Usuario';
    }
  });

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

  ngOnInit(): void {
    if (!this.esVisitantePublico()) {
      this.cargarContadorAcciones();
    }
  }

  cargarContadorAcciones(): void {
    const user = this.authService.currentUser();
    if (user && [ROL_ADMINISTRADOR, ROL_PRL_CONTRATISTA, ROL_GESTOR_SYMA].includes(user.id_rol)) {
      this.casoService.getAccionesCorrectivas().subscribe({
        next: (response: any) => {
          const acciones = Array.isArray(response) ? response : (response?.data || []);
          this.badgeAcciones.set(acciones.length);
        },
        error: (err) => console.error("Error al cargar acciones correctivas:", err),
      });
    }
  }

  isLoginPage(): boolean {
    return this.router.url.startsWith('/login');
  }

  logout(): void {
    this.authService.logout();
  }
}
