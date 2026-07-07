import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AdminUsers } from './features/admin-users/admin-users';
import { Login } from './features/login/login';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'admin', redirectTo: 'admin/usuarios', pathMatch: 'full' },
  { path: 'admin/usuarios', component: AdminUsers, canActivate: [authGuard] },
  { path: '', redirectTo: 'admin/usuarios', pathMatch: 'full' },
  { path: '**', redirectTo: 'admin/usuarios' },
];
