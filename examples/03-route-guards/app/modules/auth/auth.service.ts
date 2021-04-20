import { Injectable } from '@ts-stack/di';

import { Permission } from './types';

@Injectable()
export class AuthService {
  /**
   * Here you need implement more logic.
   */
  async hasPermissions(permissions: Permission[]) {
    const currentUser = { permissions: [Permission.canActivateSomeResource] };

    return permissions?.every((permission) => currentUser.permissions.includes(permission));
  }
}
