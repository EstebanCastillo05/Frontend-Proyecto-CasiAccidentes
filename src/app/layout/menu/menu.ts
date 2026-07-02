import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  rolesPermitidos: string[]; // estructura preparada, sin lógica de filtrado
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
    MatButtonModule
  ],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class Menu {
  menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard',
      rolesPermitidos: ['Admin','Brigada','PRL Contratista','Responsable del Proceso','Gestor SYMA','Control SYMA'] },
    { label: 'Gestión de Casos', route: '/casos', icon: 'folder_open',
      rolesPermitidos: ['Admin','Brigada','Responsable del Proceso','Gestor SYMA','Control SYMA'] },
    { label: 'Acciones Correctivas', route: '/acciones', icon: 'task_alt',
      rolesPermitidos: ['Admin','Responsable del Proceso','Gestor SYMA'] },
    { label: 'Gestión Documental', route: '/documentos', icon: 'description',
      rolesPermitidos: ['Admin','Gestor SYMA','Control SYMA'] },
    { label: 'Bitácora e Historial', route: '/bitacora', icon: 'history',
      rolesPermitidos: ['Admin','Control SYMA'] },
    { label: 'Administración', route: '/admin', icon: 'settings',
      rolesPermitidos: ['Admin'] },
  ];
}