import { rootModule, ControllerErrorHandler } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { MyControllerErrorHandler } from './my-controller-error-handler';
import { SomeModule } from './modules/some/some.module';

@rootModule({
  imports: [RouterModule],
  appends: [SomeModule],
  providersPerReq: [{ token: ControllerErrorHandler, useClass: MyControllerErrorHandler }],
  exports: [ControllerErrorHandler],
})
export class AppModule {}
