import { CommonDict } from '@dict/first/common.dict';
import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

@Injectable()
export class CommonPlDict extends CommonDict {
  override getLng(): ISO639 {
    return 'pl';
  }
  /**
   * nie, dwa, trzy
   */
  override countToThree = 'nie, dwa, trzy';
}
