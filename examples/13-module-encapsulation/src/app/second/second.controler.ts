import { inject } from '@ts-stack/di';
import { controller, Res, route } from '@ditsmod/core';

@controller()
export class SecondController {
  constructor(private res: Res, @inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'second')
  getHello() {
    this.res.sendJson(this.multiProvider);
  }
}
