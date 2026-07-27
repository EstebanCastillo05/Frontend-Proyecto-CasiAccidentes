import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const roleGuard = (rolesPermitidos: number[]): CanActivateFn => () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (user && rolesPermitidos.includes(user.id_rol)) {
    return true;
  }
  return router.createUrlTree(['/casos']);
};