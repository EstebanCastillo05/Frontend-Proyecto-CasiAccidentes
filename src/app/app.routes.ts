import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { 
  ROL_ADMINISTRADOR, 
  ROL_PRL_CONTRATISTA, 
  ROL_RESPONSABLE_PROCESO, 
  ROL_GESTOR_SYMA, 
  ROL_GESTION_CONTROL_SYMA 
} from './core/auth/roles.constants';
import { AdminUsers } from './features/admin-users/admin-users';
import { Dashboard } from './features/dashboard/dashboard';
import { Login } from './features/login/login';
import { CasoForm } from './features/casos/caso-form';
import { CasoList } from './features/casos/caso-list';
import { DocumentoListComponent } from './features/documentos/documento-list/documento-list';
import { AccionesComponent } from './acciones/acciones/acciones';

export const routes: Routes = [
  { path: '', component: Dashboard, pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'login', component: Login },
  { path: 'admin', redirectTo: 'admin/usuarios', pathMatch: 'full' },
  {
    path: 'admin/usuarios', component: AdminUsers,
    canActivate: [authGuard, roleGuard([ROL_ADMINISTRADOR])],
  },
  {
    path: 'casos/nuevo', 
    component: CasoForm,
    canActivate: [authGuard, roleGuard([ROL_ADMINISTRADOR, ROL_PRL_CONTRATISTA])],
  },
  {
    path: 'casos/:id/editar', 
    component: CasoForm,
    canActivate: [authGuard, roleGuard([
      ROL_ADMINISTRADOR, ROL_PRL_CONTRATISTA, ROL_RESPONSABLE_PROCESO, ROL_GESTOR_SYMA, ROL_GESTION_CONTROL_SYMA,
    ])],
  },
  { path: 'casos', component: CasoList, canActivate: [authGuard] },
  {
    path: 'acciones',
    component: AccionesComponent,
    canActivate: [authGuard, roleGuard([ROL_ADMINISTRADOR, ROL_PRL_CONTRATISTA, ROL_GESTOR_SYMA])],
  },
  { path: 'documentos', component: DocumentoListComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];