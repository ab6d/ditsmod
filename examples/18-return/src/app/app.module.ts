import { rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { FirstModule } from './modules/first/first.module';
import { SecondModule } from './modules/second/second.module';

@rootModule({
  imports: [RouterModule],
  appends: [FirstModule, SecondModule]
})
export class AppModule {}
