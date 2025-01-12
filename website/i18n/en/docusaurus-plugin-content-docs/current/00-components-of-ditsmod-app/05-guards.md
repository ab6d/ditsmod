---
sidebar_position: 5
---

# Guards

If you want to restrict access to certain routes, you can use guards. You can view a finished example of an application with guards in the [examples][1] folder or in [RealWorld example][2].

Any guard is a [DI provider][3] passed to request-scoped injectors. Each guard must be a class implementing the `CanActivate` interface:

```ts
interface CanActivate {
  canActivate(params?: any[]): boolean | number | Promise<boolean | number>;
}
```

For example, it can be done like this:

```ts {9-11}
import { injectable, CanActivate } from '@ditsmod/core';

import { AuthService } from './auth.service';

@injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate() {
    return Boolean(await this.authService.updateAndGetSession());
  }
}
```

It is recommended that guard files end with `*.guard.ts` and their class names end with `*Guard`.

If `canActivate()` returns:

- `true` or `Promise<true>`, means Ditsmod will process the corresponding route with this guard;
- `false` or `Promise<false>`, so the response to the request will contain a 401 status and route processing
there will be no from the controller;
- `number` or `Promise<number>` is interpreted by Ditsmod as a status number (403, 401, etc.) that should be returned in response to an HTTP request.

## Use of guards

The guards are passed to the controllers in the array in the third parameter of the `route` decorator:

```ts {7}
import { controller, Res, route } from '@ditsmod/core';

import { AuthGuard } from './auth.guard';

@controller()
export class SomeController {
  @route('GET', 'some-url', [AuthGuard])
  tellHello(res: Res) {
    res.send('Hello admin!');
  }
}
```

## Guards with parameters

The guard in the `canActivate()` method has one parameter. Arguments for this parameter can be passed in the `route` decorator in an array where a particular guard comes first.

Let's consider such an example:

```ts {8}
import { controller, Res, route } from '@ditsmod/core';

import { PermissionsGuard } from './permissions.guard';
import { Permission } from './permission';

@controller()
export class SomeController {
  @route('GET', 'some-url', [[PermissionsGuard, Permission.canActivateAdministration]])
  tellHello(res: Res) {
    res.send('Hello admin!');
  }
}
```

As you can see, in place of the third parameter in `route`, an array of arrays is passed, where `PermissionsGuard` is specified in the first place, followed by arguments for it. In this case, `PermissionsGuard` will receive these arguments in its `canActivate()` method:

```ts {10}
import { injectable, CanActivate, Status } from '@ditsmod/core';

import { AuthService } from './auth.service';
import { Permission } from './permission';

@injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(params?: Permission[]) {
    if (await this.authService.hasPermissions(params)) {
      return true;
    } else {
      return Status.FORBIDDEN;
    }
  }
}
```

## Helpers for guards with parameters

Because parameter guards must be passed as an array within an array, this makes readability and type safety worse. For such cases, it is better to create a helper using the `createHelperForGuardWithParams()` factory:

```ts {5}
import { createHelperForGuardWithParams } from '@ditsmod/core';
import { Permission } from './types';
import { PermissionsGuard } from './permissions-guard';

export const requirePermissions = createHelperForGuardWithParams<Permission>(PermissionsGuard);
```

In this example, `PermissionsGuard' is passed as an argument, which accepts parameters of type `Permission'.

`requirePermissions()` can now be used to create routes:

```ts {8}
import { controller, Res, route } from '@ditsmod/core';

import { requirePermissions } from '../auth/guards-utils';
import { Permission } from '../auth/types';

@controller()
export class SomeController {
  @route('GET', 'administration', [requirePermissions(Permission.canActivateAdministration)])
  helloAdmin(res: Res) {
    res.send('some secret');
  }
}
```

## Passing guards to injectors

Guards are passed to DI only for injectors at the request level. This can be done either in the controller or in the module:

```ts {6}
import { featureModule } from '@ditsmod/core';

import { AuthGuard } from 'auth.guard';

@featureModule({
  providersPerReq: [AuthGuard],
})
export class SomeModule {}
```

## Setting guards on the imported module

You can also centrally set guards at the module level:

```ts {10}
import { featureModule } from '@ditsmod/core';

import { OtherModule } from '../other/other.module';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/auth.guard';

@featureModule({
  imports: [
    AuthModule,
    { path: 'some-path', module: OtherModule, guards: [AuthGuard] }
  ]
})
export class SomeModule {}
```

In this case, `AuthGuard` will be automatically added to each route in `OtherModule`.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/03-route-guards
[2]: https://github.com/ditsmod/realworld/blob/main/packages/server/src/app/modules/service/auth/bearer.guard.ts
[3]: /components-of-ditsmod-app/dependency-injection#providers
