import { AnyObj } from '@ditsmod/core';
import { makePropTypeDecorator, Type } from '@ts-stack/di';
import { XSchemaObject } from '@ts-stack/openapi-spec';

export type ColumnDecoratorFactory = (schema?: XSchemaObject, ...arrayModels: Type<AnyObj>[]) => PropertyDecorator;
export interface ColumnDecoratorItem {
  schema?: XSchemaObject;
  arrayModels?: Type<AnyObj> | Type<AnyObj>[];
}
export type ColumnDecoratorValue = [Type<AnyObj>, ColumnDecoratorItem, ...ColumnDecoratorItem[]];
export interface ColumnDecoratorMetadata {
  [key: string]: ColumnDecoratorValue;
}

function transformColumnMeta(schema?: XSchemaObject, ...arrayModels: Type<AnyObj>[]) {
  if (arrayModels.length < 2) {
    return { schema, arrayModels: arrayModels[0] } as ColumnDecoratorItem;
  } else {
    return { schema, arrayModels } as ColumnDecoratorItem;
  }
}

/**
 * Decorator for model properties.
 * 
 * Usage:
 * 
 * ```ts
class Post {
  @Column({ type: 'number', minimum: 0, maximum: 100000 })
  postId: number;
}
 * ```
 */
export const Column = makePropTypeDecorator('Column', transformColumnMeta) as ColumnDecoratorFactory;
