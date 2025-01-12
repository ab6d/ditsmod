import { Class, PropMeta, ParamsMeta, PropMetadataTuple, DecoratorAndValue } from './types-and-models';
import { isType, newArray } from './utils';
import { CLASS_KEY, getMetaKey, PARAMS_KEY, PROP_KEY } from './decorator-factories';

/**
 * Attention: These regex has to hold even if the code is minified!
 */
const DELEGATE_CTOR = /^function\s+\S+\(\)\s*{[\s\S]+\.apply\(this,\s*arguments\)/;
const INHERITED_CLASS = /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{/;
const INHERITED_CLASS_WITH_CTOR = /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{[\s\S]*constructor\s*\(/;
const INHERITED_CLASS_WITH_DELEGATE_CTOR =
  /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{[\s\S]*constructor\s*\(\)\s*{\s+super\(\.\.\.arguments\)/;

/**
 * Determine whether a stringified type is a class which delegates its constructor
 * to its parent.
 *
 * This is not trivial since compiled code can actually contain a constructor function
 * even if the original source code did not. For instance, when the child class contains
 * an initialized instance property.
 */
export function isDelegateCtor(typeStr: string): boolean {
  return (
    DELEGATE_CTOR.test(typeStr) ||
    INHERITED_CLASS_WITH_DELEGATE_CTOR.test(typeStr) ||
    (INHERITED_CLASS.test(typeStr) && !INHERITED_CLASS_WITH_CTOR.test(typeStr))
  );
}

export class Reflector {
  private reflect: typeof Reflect;

  constructor(reflect?: typeof Reflect) {
    this.reflect = reflect || Reflect;
  }

  /**
   * Returns the metadata for passed class.
   *
   * @param Cls A class that has decorators.
   */
  getClassMetadata<T = any>(Cls: Class): DecoratorAndValue<T>[] {
    if (!isType(Cls)) {
      return [];
    }
    const parentClass = this.getParentClass(Cls);
    const ownClassAnnotations = this.getOwnClassAnnotations(Cls) || [];
    const parentAnnotations = parentClass !== Object ? this.getClassMetadata<T>(parentClass) : [];
    return parentAnnotations.concat(ownClassAnnotations);
  }

  /**
   * Returns the metadata for the properties of the passed class.
   *
   * @param Cls A class that has decorators.
   */
  getPropMetadata<Proto extends object>(Cls: Class<Proto>): PropMeta<Proto> {
    if (!isType(Cls)) {
      return {} as PropMeta<Proto>;
    }
    const parentClass = this.getParentClass(Cls);
    const propMetadata = {} as PropMeta<Proto>;
    if (parentClass !== Object) {
      const parentPropMetadata = this.getPropMetadata(parentClass);
      // Merging current meta with parent meta
      Object.keys(parentPropMetadata).forEach((propName) => {
        (propMetadata as any)[propName] = parentPropMetadata[propName];
      });
    }
    const ownPropMetadata = this.getOwnPropMetadata(Cls);
    if (ownPropMetadata) {
      Object.keys(ownPropMetadata).forEach((propName) => {
        const type = (this.reflect as any).getOwnMetadata('design:type', Cls.prototype, propName);
        const decorators: PropMetadataTuple = [type];
        if (propMetadata.hasOwnProperty(propName)) {
          decorators.push(...(propMetadata as any)[propName].slice(1));
        }
        decorators.push(...ownPropMetadata[propName]);
        (propMetadata as any)[propName] = decorators;
      });
    }
    return propMetadata;
  }

  /**
   * Returns the metadata for the constructor or methods of the passed class.
   *
   * @param Cls A class that has decorators.
   * @param propertyKey If this method is called without `propertyKey`,
   * it's returns parameters of class constructor.
   */
  getParamsMetadata(Cls: Class, propertyKey?: string | symbol): (ParamsMeta | null)[] {
    if (!isType(Cls)) {
      return [];
    }
    const parentClass = this.getParentClass(Cls);

    /**
     * If we have no decorators, we only have function.length as metadata.
     * In that case, to detect whether a child class declared an own constructor or not,
     * we need to look inside of that constructor to check whether it is
     * just calling the parent.
     * This also helps to work around for https://github.com/Microsoft/TypeScript/issues/12439
     * that sets 'design:paramtypes' to []
     * if a class inherits from another class but has no ctor declared itself.
     */
    if (isDelegateCtor(Cls.toString())) {
      if (parentClass !== Object) {
        return this.getParamsMetadata(parentClass, propertyKey);
      }
      return [];
    } else {
      return this.getOwnParams(Cls, propertyKey);
    }
  }

  private getParentClass(ctor: Class): Class {
    const parentProto = ctor.prototype ? Object.getPrototypeOf(ctor.prototype) : null;
    const parentClass = parentProto ? parentProto.constructor : null;
    // Note: We always use `Object` as the null value
    // to simplify checking later on.
    return parentClass || Object;
  }

  private mergeTypesAndClassMeta(paramTypes: any[], paramMetadata: any[]): ParamsMeta[] {
    let result: ParamsMeta[];

    if (typeof paramTypes == 'undefined') {
      result = newArray(paramMetadata.length);
    } else {
      result = newArray(paramTypes.length);
    }

    for (let i = 0; i < result.length; i++) {
      // TS outputs Object for parameters without types, while Traceur omits
      // the annotations. For now we preserve the Traceur behavior to aid
      // migration, but this can be revisited.
      if (typeof paramTypes == 'undefined') {
        result[i] = [];
      } else if (paramTypes[i] && paramTypes[i] != Object) {
        result[i] = [paramTypes[i]] as unknown as ParamsMeta;
      } else {
        result[i] = [];
      }
      if (paramMetadata && paramMetadata[i] != null) {
        result[i] = result[i].concat(paramMetadata[i]) as ParamsMeta;
      }
    }
    return result;
  }

  private getOwnParams(Cls: Class, propertyKey?: string | symbol): ParamsMeta[] | null[] {
    const key = getMetaKey(PARAMS_KEY, propertyKey);
    const paramMetadata = Cls.hasOwnProperty(key) && (Cls as any)[key];
    const args = propertyKey ? [Cls.prototype, propertyKey] : [Cls];
    const paramTypes = (this.reflect as any).getOwnMetadata('design:paramtypes', ...args);

    if (paramTypes || paramMetadata) {
      return this.mergeTypesAndClassMeta(paramTypes, paramMetadata);
    }

    /**
     * If a class or method has no decorators, at least create metadata
     * based on function.length.
     */
    if (propertyKey) {
      return newArray(Cls.prototype[propertyKey]?.length || 0, null);
    } else {
      return newArray(Cls.length, null);
    }
  }

  private getOwnClassAnnotations(typeOrFunc: Class): any[] | null {
    // API for metadata created by invoking the decorators.
    if (typeOrFunc.hasOwnProperty(CLASS_KEY)) {
      return (typeOrFunc as any)[CLASS_KEY];
    }
    return null;
  }

  private getOwnPropMetadata(typeOrFunc: any): { [key: string]: any[] } | null {
    // API for metadata created by invoking the decorators.
    if (typeOrFunc.hasOwnProperty(PROP_KEY)) {
      return (typeOrFunc as any)[PROP_KEY];
    }
    return null;
  }
}
