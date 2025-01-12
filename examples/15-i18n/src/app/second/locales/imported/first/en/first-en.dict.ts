import { ISO639 } from '@ditsmod/i18n';
import { injectable } from '@ditsmod/core';

import { FirstDict } from '@dict/first/first.dict';

@injectable()
export class FirstEnDict extends FirstDict {
  override getLng(): ISO639 {
    return 'en';
  }
  /**
   * overrided: one, two, three
   */
  override countToThree = 'overrided: one, two, three';
}
