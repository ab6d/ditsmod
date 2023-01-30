import { Class, reflector } from '@ditsmod/core';

import { TableConfig } from './types';

export function getTableMetadata<T extends Class>(Cls: T, alias: string): TableMetadata<T> {
  const config: TableConfig | undefined = reflector.getClassMetadata(Cls)[0]?.value;
  const tableNameWithAlias = `${config?.tableName || Cls.name} as ${alias}`;

  const newObj: any = {
    toString() {
      return tableNameWithAlias;
    },
  };

  for (const key in new Cls()) {
    newObj[key] = `${alias}.${key}`;
  }

  return [newObj, tableNameWithAlias, alias];
}

export type TableMetadata<T extends Class> = [Record<keyof InstanceType<T>, string>, string, string];
