import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

import { ErrorsDict } from '@dict/second/errors.dict';

@Injectable()
export class ErrorsUkDict extends ErrorsDict {
  override getLng(): ISO639 {
    return 'uk';
  }
  /**
   * Не можна з'єднадись із базою даних ${database}.
   */
   override mysqlConnect(database: string) {
    return `Не можна з'єднадись із базою даних ${database}` as const;
  }
}