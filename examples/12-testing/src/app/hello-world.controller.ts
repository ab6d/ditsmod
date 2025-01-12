import { controller, Res, route } from '@ditsmod/core';

import { MyService } from './my.service';

@controller()
export class HelloWorldController {
  constructor(private myService: MyService) {}

  @route('GET')
  async helloWorld(res: Res) {
    const message = await this.myService.helloWorld();
    res.send(message);
  }

  @route('GET', 'admin')
  async helloAdmin(res: Res) {
    const message = await this.myService.helloAdmin();
    res.send(message);
  }
}
