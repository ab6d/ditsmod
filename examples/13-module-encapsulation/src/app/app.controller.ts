import { controller, route, inject, Res, Req} from '@ditsmod/core';

import { FirstPerRouService } from './first/first-per-rou.service';
import { ThirdService } from './third/three.service';

@controller()
export class AppController {
  constructor(
    private threeService: ThirdService,
    private onePerRouService: FirstPerRouService,
    @inject('multi-provider') private multiProvider: any
  ) {}

  @route('GET')
  showCounters(res: Res) {
    const msg = `per req counter: ${this.threeService.getCounter()}, per rou counter: ${this.onePerRouService.getCounter()}`;
    res.send(msg);
  }

  @route('POST')
  showRequestBody(res: Res, req: Req) {
    res.sendJson({ body: this.threeService.getBody(req) });
  }

  @route('GET', 'zero')
  getMultiProvideValue(res: Res) {
    res.sendJson(this.multiProvider);
  }
}
