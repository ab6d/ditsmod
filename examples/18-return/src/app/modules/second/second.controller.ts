import { controller, Res, route } from '@ditsmod/core';

@controller()
export class SecondController {
  constructor(private res: Res) {}

  @route('GET', 'second')
  async method1() {
    this.res.send('default send');
  }

  @route('GET', 'second-json')
  async method2() {
    return { msg: 'JSON object' };
  }

  @route('GET', 'second-string')
  async method3() {
    return 'Some string';
  }
}
