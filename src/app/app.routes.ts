import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { ROL_ADMINISTRADOR, ROL_BRIGADA, ROL_PRL_CONTRATISTA, ROL_RESPONSABLE_PROCESO, ROL_GESTOR_SYMA, ROL_GESTION_CONTROL_SYMA } from './core/auth/roles.constants';
import { AdminUsers } from './features/admin-users/admin-users';
import { Dashboard } from './features/dashboard/dashboard';
import { Login } from './features/login/login';
import { CasoForm } from './features/casos/caso-form';
import { CasoList } from './features/casos/caso-list';
import { DocumentoListComponent } from './features/documentos/documento-list/documento-list';


export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'reportes-publicos', component: Dashboard },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'admin', redirectTo: 'admin/usuarios', pathMatch: 'full' },
  {
    path: 'admin/usuarios', component: AdminUsers,
    canActivate: [authGuard, roleGuard([ROL_ADMINISTRADOR])],
  },
  { path: 'casos', component: CasoList, canActivate: [authGuard] },
  {
    path: 'casos/nuevo', component: CasoForm,
    canActivate: [authGuard, roleGuard([ROL_ADMINISTRADOR, ROL_BRIGADA])], // <-- Agregado ROL_BRIGADA aquí
  },
  {
    path: 'casos/:id/editar', component: CasoForm,
    canActivate: [authGuard, roleGuard([
      ROL_ADMINISTRADOR, ROL_PRL_CONTRATISTA, ROL_RESPONSABLE_PROCESO, ROL_GESTOR_SYMA, ROL_GESTION_CONTROL_SYMA,
    ])],
  },
  { path: 'documentos', component: DocumentoListComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'casos', pathMatch: 'full' },
  { path: '**', redirectTo: 'casos' },
];