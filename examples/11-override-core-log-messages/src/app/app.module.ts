import { RootModule, Providers, SystemLogMediator } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { MyLogMediator } from './my-log-mediator';
import { SomeModule } from './modules/some/some.module';
import { OtherModule } from './modules/other/other.module';

@RootModule({
  imports: [RouterModule, { path: '', module: SomeModule }, { path: '', module: OtherModule }],
  providersPerApp: [
    MyLogMediator, // This allow use MyLogMediator in this application
    ...new Providers()
      .useClass(SystemLogMediator, MyLogMediator) // This allow use MyLogMediator internaly in Ditsmod core
      .useLogConfig({ level: 'trace' }, { modulesNames: ['OtherModule'] }) // You can remove filter with modulesNames
  ],
})
export class AppModule {}
