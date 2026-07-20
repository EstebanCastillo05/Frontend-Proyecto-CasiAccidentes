import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AdminUsers } from './features/admin-users/admin-users';
import { Login } from './features/login/login';
import { CasoForm } from './features/casos/caso-form';
import { CasoList } from './features/casos/caso-list';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'admin', redirectTo: 'admin/usuarios', pathMatch: 'full' },
  { path: 'admin/usuarios', component: AdminUsers, canActivate: [authGuard] },
  { path: 'casos', component: CasoList, canActivate: [authGuard] },
  { path: 'casos/nuevo', component: CasoForm, canActivate: [authGuard] },
  { path: 'casos/:id/editar', component: CasoForm, canActivate: [authGuard] },
  { path: '', redirectTo: 'admin/usuarios', pathMatch: 'full' },
  { path: '**', redirectTo: 'admin/usuarios' },
];