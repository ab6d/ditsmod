import { makeClassDecorator, makePropDecorator, makeParamDecorator } from './decorator-factories';

/**
 * Allows you to use an alternative token for a specific dependency.
 * 
 * ### Example
 *
```ts
class Engine {}

@injectable()
class Car {
  constructor(@inject('MyEngine') public engine: Engine) {}
}

const injector =
    Injector.resolveAndCreate([{token: 'MyEngine', useClass: Engine}, Car]);

expect(injector.get(Car).engine instanceof Engine).toBe(true);
```
  *
  * When `@inject()` is not present, `Injector` will use the type annotation of the
  * parameter.
  *
  * ### Example
  *
```ts
class Engine {}

@injectable()
class Car {
  constructor(public engine: Engine) {
  }  // same as constructor(@inject(Engine) engine:Engine)
}

const injector = Injector.resolveAndCreate([Engine, Car]);
expect(injector.get(Car).engine instanceof Engine).toBe(true);
```
   */
export const inject = makeParamDecorator((token: any) => token);

/**
 * A parameter metadata that marks a dependency as optional.
 * `Injector` provides `null` if the dependency is not found.
 *
 * ### Example
 *
```ts
class Engine {}

@injectable()
class Car {
  constructor(@optional() public engine: Engine) {}
}

const injector = Injector.resolveAndCreate([Car]);
expect(injector.get(Car).engine).toBeNull();
```
 */
export const optional = makeParamDecorator(() => undefined);

/**
 * A marker metadata that marks a class as available to `Injector` for creation.
 *
 * ### Example
 *
```ts
@injectable()
class Service1 {
}

@injectable()
class Service2 {
  constructor(public service1: Service1) {}
}

const injector = Injector.resolveAndCreate([Service2, Service1]);
const service2 = injector.get(Service2);
expect(service2.service1 instanceof Service1).toBe(true);
```
 *
 * `Injector` will throw an error when trying to instantiate a class that does have a dependecy and
 * does not have `@injectable` marker, as shown in the example below.
 *
```ts
class Service1 {}

class Service2 {
  constructor(public service1: Service1) {}
}

expect(() => Injector.resolveAndCreate([Service2, Service1])).toThrow();
```
 */
export const injectable = makeClassDecorator(() => undefined);

/**
 * Specifies that an injector should retrieve a dependency only from itself (ignore parent injectors).
 *
 *
 * ### Example
 *
```ts
class Service1 {}

@injectable()
class Service2 {
  constructor(@fromSelf() public service1: Service1) {}
}

const inj = Injector.resolveAndCreate([Service1, Service2]);
const service2 = inj.get(Service2);

expect(service2.service1 instanceof Service1).toBe(true);

parent = Injector.resolveAndCreate([Service1, Service2]);
const child = parent.resolveAndCreateChild([]);
expect(() => child.get(Service2)).toThrowError();
```
 */
export const fromSelf = makeParamDecorator(() => undefined);

/**
 * ### Description
 *
 * Specifies that the dependency resolution should start from the parent injector.
 *
 *
 * ### Example
 *
```ts
class Service1 {}

@injectable()
class Service2 {
  constructor(@skipSelf() public service1: Service1) {}
}

const parent = Injector.resolveAndCreate([Service1]);
const child = parent.resolveAndCreateChild([Service2]);
const service2 = inj.get(Service2);
expect(service2.service1 instanceof Service1).toBe(true);

const inj = Injector.resolveAndCreate([Service1, Service2]);
expect(() => inj.get(Service2)).toThrowError();
```
 */
export const skipSelf = makeParamDecorator(() => undefined);

/**
 * Used to mark methods in a class for FactoryProvider.
 */
export const methodFactory = makePropDecorator(() => undefined);
