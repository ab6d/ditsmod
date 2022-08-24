import { Controller, Req, Res, Route } from '@ditsmod/core';
import { DictService } from '@ditsmod/i18n';

import { FirstService } from '../first/first.service';
import { CommonDict } from '@dict/second/common.dict';

@Controller()
export class SecondController {
  constructor(private req: Req, private res: Res, private dictService: DictService, private firstService: FirstService) {}

  @Route('GET', 'second/:userName')
  tellHello() {
    const dict = this.dictService.getDictionary(CommonDict);
    const { userName } = this.req.pathParams;
    const msg = dict.hello(userName);

    this.res.send(msg);
  }

  @Route('GET', 'first-extended')
  tellHefllo() {
    this.res.send(this.firstService.countToThree());
  }
}
