import { AnyObj, controller, inject, PATH_PARAMS, Res, route } from '@ditsmod/core';
import { DictService } from '@ditsmod/i18n';

import { FirstService } from '../first/first.service';
import { SecondDict } from '@dict/second/second.dict';

@controller()
export class SecondController {
  constructor(private dictService: DictService, private firstService: FirstService) {}

  @route('GET', 'second/:userName')
  tellHello(@inject(PATH_PARAMS) pathParams: AnyObj, res: Res) {
    const dict = this.dictService.getDictionary(SecondDict);
    const { userName } = pathParams;
    const msg = dict.hello(userName);

    res.send(msg);
  }

  @route('GET', 'first-extended')
  tellHefllo(res: Res) {
    res.send(this.firstService.countToThree());
  }
}
