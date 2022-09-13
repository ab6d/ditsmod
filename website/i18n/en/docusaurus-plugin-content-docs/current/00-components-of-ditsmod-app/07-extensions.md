---
sidebar_position: 7
---

# Extensions

## The purpose of Ditsmod extension

The main difference between an extension and a regular service is that the extension can do its job before the web server starts, and it can dynamically add providers at the module level, route level or request level. To modify or extend the behavior of the application, an extension typically uses metadata attached to certain decorators.

For example, `@ditsmod/body-parser` module has an extension that dynamically adds an HTTP interceptor for parsing the request body to each route that has the appropriate method (POST, PATCH, PUT). It does this once before the start of the web server, so there is no need to test the need for such parsing for each request.

Another example. For example, the `@ditsmod/openapi` module allows you to create OpenAPI documentation using the new `@OasRoute` decorator. Without extensions, the metadata passed to this decorator would be incomprehensible to `@ditsmod/core`.

## What is Ditsmod extension

In Ditsmod, **extension** is a class that implements the `Extension` interface:

```ts
interface Extension<T> {
  init(isLastExtensionCall: boolean): Promise<T>;
}
```

Each extension needs to be registered, this will be mentioned later, and now let's assume that such registration has taken place, the application is running, and then goes the following process:

1. collecting metadata from all decorators (`@RootModule`, `@Module`, `@Controller`, `@Route` ...and even from unknown decorators, but provided that they are created using the `@ts-stack/di` library);
2. this metadata then passing to DI with token `MetadataPerMod1`, therefore - any extension can receive this metadata in the constructor;
3. per module work of extensions begins, that is, for each Ditsmod module the extensions registered in this module or imported in this module are selected, and the metadata collected in this module is also transmitted to them; then the `init()` method of each extension is called;
4. the web server starts, and the application starts working normally, processing HTTP requests.

It should be noted that the order of running extensions can be considered as "random", so each extension must declare dependence on another extension (if any) in its constructors, as well as in the methods `init()`. In this case, regardless of the startup order, all extensions will work correctly:

```ts
async init() {
  await this.otherExtention.init();
  // The current extension works after the initialization of another extension is completed.
}
```

This means that the `init()` method of a particular extension can be called as many times as it is written in the body of other extensions that depend on the job of that extension. This specificity must be taken into account:

```ts
async init() {
  if (this.inited) {
    return;
  }
  // Do something good.
  this.inited = true;
}
```

## Creating an extension class

You can see a simple example in the folder [09-one-extension][1].

Create a class that implements the `Extension` interface:

```ts
import { Injectable } from '@ts-stack/di';
import { Extension } from '@ditsmod/core';

@Injectable()
export class MyExtension implements Extension<void> {
  private data: boolean;

  async init() {
    if (this.data) {
      return this.data;
    }
    // ...
    // Do something good
    // ...
    this.data = result;
    return this.data;
  }
}
```

For the extension to work, you can get all the necessary data either through the constructor or from another extension by calling its `init()` method:

```ts
import { Injectable } from '@ts-stack/di';
import { Extension, MetadataPerMod1 } from '@ditsmod/core';

@Injectable()
export class Extension1 implements Extension<any> {
  private data: any;

  constructor(private metadataPerMod1: MetadataPerMod1) {}

  async init() {
    if (this.data) {
      return this.data;
    }
    // Do something good with `this.metadataPerMod1`.
    // ...
    this.data = result;
    return this.data;
  }
}

@Injectable()
export class Extension2 implements Extension<void> {
  private inited: boolean;

  constructor(private extension1: Extension1) {}

  async init() {
    if (this.inited) {
      return;
    }

    const data = await this.extension1.init();
    // Do something here.
    this.inited = true;
  }
}
```

As you can see, `Extension1` receives data for its work directly through the constructor. Once it has done its job, the result is stored locally and issued on repeated calls.

`Extension2` also takes into account the possibility of re-calling `init()`, so during the second call, this method will not re-initialize. In addition, `Extension2` depends on the data taken from `Extension1`, so its constructor specifies `Extension1`, and in the body `init()` asynchronously called `this.extension1.init()`.

## Extension registration

Register the extension in an existing extension group, or create a new group, even if it has a single extension. You will need to create a new DI token for the new group.

### What do you need extension groups for

What it gives:

- If you create extensions group in the current module, it can be supplemented by other extensions in external modules, without having to change the code in the current module. Sometimes it will not even be necessary to call any services from the current module in order to integrate it into an external module, it will be enough to import it.
- You can arrange the sequence of work of extensions that perform different types of work. By "different types of work" it is meant, for example, that one group of extensions can add routes, the second - HTTP interceptors, the third - set metrics, etc.

For example, in `@ditsmod/core` there is a `ROUTES_EXTENSIONS` group, which by default includes a single extension that handles metadata collected from the `@Route()` decorator. If an application requires OpenAPI documentation, you can use `@ditsmod/openapi`, which also has an extension registered in the `ROUTES_EXTENSIONS` group, but this extension works with the `@OasRoute()` decorator. In this case, two extensions will already be registered in the `ROUTES_EXTENSIONS` group, each of which will prepare data for setting router routes. These extensions are grouped together because their `init()` methods return data with the same base interface.

A single base interface for all extensions in a group is an important requirement because other extensions can expect data from that group and will rely on that base interface. Of course, if necessary, the basic interface can be expanded, but not narrowed.

In our example, after all the extensions from the `ROUTES_EXTENSIONS` group have worked, their data is collected in one array and transferred to the `PRE_ROUTER_EXTENSIONS` group. Even if you later register more new extensions in the `ROUTES_EXTENSIONS` group, the `PRE_ROUTER_EXTENSIONS` group will still start after all the extensions in the `ROUTES_EXTENSIONS` group have worked, including your new extensions.

This feature is very useful because it sometimes allows you to integrate external Ditsmod modules (for example from npmjs.com) into your application without any configuration, just by importing them into the desired module. Thanks to extension groups, imported extensions will run in the correct sequence, even if they are imported from different external modules.

This is how the `@ditsmod/body-parser` extension works, for example. You simply import `BodyParserModule` and its extension will already run in the correct order that is specified in this module. In this case, its extension will run after the `ROUTES_EXTENSIONS` group, but before the `PRE_ROUTER_EXTENSIONS` group. Moreover, please note that `BodyParserModule` has no idea which extensions will work in these groups, it only cares about:

1. data interface that will be returned by extensions from the `ROUTES_EXTENSIONS` group;
2. order of execution, so that routes are not set before it works (that is, so that the group `PRE_ROUTER_EXTENSIONS` works after it, and not before it).

This means that `BodyParserModule` will take into account routes set using the `@Route()` or `@OasRoute()` decorators, or any other decorators from this group, as they are handled by the running extensions before it in the `ROUTES_EXTENSIONS` group.

### Creating a new group token

The extension group token must be an instance of the `InjectionToken` class.

For example, to create a token for the group `MY_EXTENSIONS`, you need to do the following:

```ts
import { InjectionToken } from '@ts-stack/di';
import { Extension } from '@ditsmod/core';

export const MY_EXTENSIONS = new InjectionToken<Extension<void>[]>('MY_EXTENSIONS');
```

As you can see, each extension group must specify that DI will return an array of extension instances: `Extension<void>[]`. This must be done, the only difference may be in the generic `Extension<T>[]`.

### Extension registration

Objects of the following type can be transferred to the `extensions` array, which is in the module's metadata:

```ts
export class ExtensionOptions {
  extension: ExtensionType;
  groupToken: InjectionToken<Extension<any>[]>;
  /**
   * The token of the group before which this extension will be called.
   */
  nextToken?: InjectionToken<Extension<any>[]>;
  /**
   * Indicates whether this extension needs to be exported.
   */
  exported?: boolean;
}
```

The `nextToken` property is used when you want your extension group to run before another extension group:

```ts
import { Module } from '@ditsmod/core';
import { ROUTES_EXTENSIONS } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my.extension';

@Module({
  extensions: [
    { extension: MyExtension, groupToken: MY_EXTENSIONS, nextToken: ROUTES_EXTENSIONS, exported: true }
  ],
})
export class SomeModule {}
```

That is, the token of the group `MY_EXTENSIONS`, to which your extension belongs, is transferred to the `groupToken` property. The token of the `ROUTES_EXTENSIONS` extension group, before which the `MY_EXTENSIONS` group should be started, is passed to the `nextToken` property. The `exported` property indicates whether this extension should be exported from the current module.

If for your extension it is not important for which group of extensions it will work, you can simplify the registration:

```ts
import { Module } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my.extension';

@Module({
  extensions: [
    { extension: MyExtension, groupToken: MY_EXTENSIONS, exported: true }
  ],
})
export class SomeModule {}
```

## Using ExtensionsManager

For simplicity, [Creating an extension class][2] contains an example where the dependence of `Extension2` on `Extension1` is specified, but it is recommended to specify the dependence on the group of extensions, and not directly on a specific extension. In this case, you do not need to know the names of all the extensions in the extension group, just know the interface of the data returned with `init()`.

`ExtensionsManager` is used to run groups of extensions, it is also useful in that it throws errors about cyclic dependencies between extensions, and shows the whole chain of extensions that led to loops. Additionally, `ExtensionsManager` allows you to collect extensions initialization results from the entire application, not just from a single module.

Suppose `MyExtension` has to wait for the initialization of the `OTHER_EXTENSIONS` group to complete. To do this, you must specify the dependence on `ExtensionsManager` in the constructor, and in `init()` call `init()` of this service:

```ts
import { Injectable } from '@ts-stack/di';
import { Extension, ExtensionsManager } from '@ditsmod/core';

import { OTHER_EXTENSIONS } from './other.extensions';

@Injectable()
export class MyExtension implements Extension<void> {
  private inited: boolean;

  constructor(private extensionsManager: ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    await this.extensionsManager.init(OTHER_EXTENSIONS);
    // Do something here.
    this.inited = true;
  }
}
```

`ExtensionsManager` will sequentially cause the initialization of all extensions from the specified group, and the result of their work will return as an array. If extensions return arrays, they will automatically merge into a single resulting array. This behavior can be changed if the second argument in `init()` pass `false`:

```ts
await this.extensionsManager.init(OTHER_EXTENSIONS, false);
```

It is important to remember that running `init()` a particular extension processes data only in the context of the current module. For example, if `MyExtension` is imported into three different modules, Ditsmod will sequentially process these three modules with three different `MyExtension` instances. This means that one extension instance will only be able to collect data from one module.

In case you need to accumulate the results of a certain extension from all modules, you need to do the following:

```ts
import { Injectable } from '@ts-stack/di';
import { Extension, ExtensionsManager } from '@ditsmod/core';

import { OTHER_EXTENSIONS } from './other.extensions';

@Injectable()
export class MyExtension implements Extension<void | false> {
  private inited: boolean;

  constructor(private extensionsManager: ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    const result = await this.extensionsManager.init(OTHER_EXTENSIONS, true, MyExtension);
    if (!result) {
      return false;
    }

    // Do something here.
    this.inited = true;
  }
}
```

That is, when you need `MyExtension` to receive data from the `OTHER_EXTENSIONS` group from the entire application, you need to pass `MyExtension` as the third argument here:

```ts
const result = await this.extensionsManager.init(OTHER_EXTENSIONS, true, MyExtension);
```

This expression will return `false` until the last time the group `OTHER_EXTENSIONS` is called. For example, if the group `OTHER_EXTENSIONS` works in three different modules, then this expression in the first two modules will return `false`, and in the third - the value that this group of extensions should return.

## Dynamic addition of providers

Each extension can specify a dependency on the `ROUTES_EXTENSIONS` group to dynamically add providers at the level of:

- module,
- route,
- request.

You can see how it is done in [BodyParserExtension][3]:

```ts
@Injectable()
export class BodyParserExtension implements Extension<void> {
  private inited: boolean;

  constructor(protected extensionManager: ExtensionsManager, protected injectorPerApp: InjectorPerApp) {}

  async init() {
    if (this.inited) {
      return;
    }

    // Getting the metadata collected using the ROUTES_EXTENSIONS group
    const aMetadataPerMod2 = await this.extensionManager.init(ROUTES_EXTENSIONS);

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      // First, extracting the metadata of a module
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;

      // Then, extracting the metadata of a controller
      aControllersMetadata2.forEach(({ providersPerRou, providersPerReq }) => {
        // Merging the providers from a module and a controller
        const mergedProvidersPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const mergedProvidersPerReq = [...metadataPerMod2.providersPerReq, ...providersPerReq];

        // Creating a hierarchy of injectors.
        const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedProvidersPerRou);
        const injectorPerReq = injectorPerRou.resolveAndCreateChild(mergedProvidersPerReq);

        // Extracting the metadata for a route,
        // and based on it, we either add an interceptor to injectorPerReq, or not.
        const routeMeta = injectorPerRou.get(RouteMeta) as RouteMeta;
        const bodyParserConfig = injectorPerReq.resolveAndInstantiate(BodyParserConfig) as BodyParserConfig;
        if (bodyParserConfig.acceptMethods.includes(routeMeta.httpMethod)) {
          providersPerReq.push({ provide: HTTP_INTERCEPTORS, useClass: BodyParserInterceptor, multi: true });
        }
      });
    });

    this.inited = true;
  }
}
```

Of course, such a dynamic addition of providers is possible only before the start of the web server.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/09-one-extension
[2]: #creating-an-extension-class
[3]: https://github.com/ditsmod/ditsmod/blob/0c4660a77/packages/body-parser/src/body-parser.extension.ts#L27-L40