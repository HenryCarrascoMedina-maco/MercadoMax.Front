import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const permission = route.data?.['permission'] as string | undefined;
  if (!permission) return true;

  if (auth.hasPermission(permission)) return true;

  router.navigate(['/inicio']);
  return false;
};
