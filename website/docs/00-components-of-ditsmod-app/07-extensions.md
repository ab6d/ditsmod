---
sidebar_position: 7
---

# Розширення

## Що робить розширення Ditsmod

Сама головна відмінність розширення від звичайного сервісу в тому, що розширення може виконувати свою роботу перед стартом вебсервера, і при цьому воно може динамічно додавати провайдери на рівні конкретного модуля, роуту чи запиту. Щоб змінити або розширити роботу застосунку, як правило, розширення використовує метадані, закріплені за певними декораторами.

Наприклад, в модулі `@ditsmod/body-parser` працює розширення, що динамічно додає HTTP-інтерсептор для парсингу тіла запиту до кожного роута, що має відповідний метод (POST, PATCH, PUT). Воно це робить один раз перед стартом вебсервера, тому за кожним запитом вже немає необхідності тестувати потребу такого парсингу.

Інший приклад. Модуль `@ditsmod/openapi` дозволяє створювати OpenAPI-документацію за допомогою власного декоратора `@OasRoute`. Без роботи розширень, метадані, передані у цей новий декоратор, були б незрозумілими для `@ditsmod/core`.

## Що таке розширення Ditsmod

У Ditsmod **розширенням** називається клас, що впроваджує інтерфейс `Extension`:

```ts
interface Extension<T> {
  init(isLastExtensionCall: boolean): Promise<T>;
}
```

Кожне розширення потрібно реєструвати, про це буде згадано пізніше, а зараз припустимо, що така реєстрація відбулася, застосунок запущено, після чого йде наступний процес:

1. збираються метадані з усіх декораторів (`@RootModule`, `@Module`, `@Controller`, `@Route`... і навіть із невідомих декораторів, але при умові, що вони створені за допомогою бібліотеки `@ts-stack/di`);
2. зібрані метадані передаються в DI з токеном `MetadataPerMod1`, отже - будь-яке розширення може отримати ці метадані у себе в конструкторі;
3. починається по-модульна робота розширень, тобто, для кожного модуля Ditsmod відбираються  розширення, створені у цьому модулі, або імпортовані в цей модуль, їм передаються метадані,  зібрані теж у цьому модулі, і викликаються їхні методи `init()`;
4. стартує вебсервер, і застосунок починає працювати у звичному режимі, обробляючи HTTP-запити.

Тут варто врахувати, що порядок запуску розширень можна вважати "випадковим", тому кожне розширення повинно прописувати залежність від іншого розширення (якщо таке є) у своїх конструкторах, а також у методах `init()`. В такому разі, не залежно від порядку запуску, усі розширення працюватимуть коректно:

```ts
async init() {
  await this.otherExtention.init();
  // Робота поточного розширення відбувається після завершення ініціалізації іншого розширення.
}
```

Це означає, що метод `init()` певного розширення може викликатись стільки разів, скільки разів він прописаний у тілі інших розширень, які залежать від роботи даного розширення. Цю особливість необхідно обов'язково враховувати, щоб не відбувалась зайва ініціалізація:

```ts
async init() {
  if (this.inited) {
    return;
  }
  // Щось хороше робите.
  this.inited = true;
}
```

## Створення класу розширення

Готовий простий приклад ви можете проглянути у теці [09-one-extension][1].

Створіть клас, що впроваджує інтерфейс `Extension`:

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
    // Щось хороше робите
    // ...
    this.data = result;
    return this.data;
  }
}
```

Для роботи розширення, усі необхідні дані ви можете отримати або через конструктор, або від іншого розширення через виклик його методу `init()`:

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
    // Щось хороше робите із this.metadataPerMod1.
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

Як бачите, `Extension1` отримує дані для своєї роботи безпосередньо через конструктор. Після того, як воно виконало свою роботу, результат зберігається локально і видається при повторних викликах.

В `Extension2` теж враховано можливість повторного виклику `init()`, тому під час другого виклику, цей метод не буде робити повторну ініціалізацію. Окрім цього, `Extension2` залежить від даних, взятих з `Extension1`, тому в його конструкторі указано `Extension1`, а в тілі `init()` асинхронно викликається `this.extension1.init()`.

## Реєстрація розширення

Зареєструйте розширення в існуючій групі розширень, або створіть нову групу, навіть якщо у ній буде єдине розширення. Для нової групи вам потрібно буде створити новий DI токен.

### Для чого потрібні групи розширень

Що це дає:

- Якщо ви створите групу розширень у поточному модулі, її можна буде доповнювати іншими розширеннями у зовнішніх модулях, без необхідності зміни коду у поточному модулі. Інколи навіть не потрібно буде викликати будь-які сервіси з поточного модуля для того, щоб інтегрувати його у зовнішній модуль, достатньо буде його імпортувати.
- Можна упорядковувати послідовність роботи розширень, що виконують різні види робіт. Під "різними видами робіт" мається на увазі, наприклад, що одна група розширень може додавати роути, друга - HTTP-інтерсептори, третя - встановлювати метрики, і т.п.

Наприклад, у `@ditsmod/core` існує група `ROUTES_EXTENSIONS` в яку по-дефолту входить єдине розширення, що обробляє метадані, зібрані з декоратора `@Route()`. Якщо в якомусь застосунку потрібна документація OpenAPI, можна підключити модуль `@ditsmod/openapi`, де також зареєстровано розширення у групі `ROUTES_EXTENSIONS`, але це розширення працює з декоратором `@OasRoute()`. В такому разі, у групі `ROUTES_EXTENSIONS` вже буде зареєстровано два розширення, кожне з яких готуватиме дані для встановлення маршрутів роутера. Ці розширення зібрані в одну групу, оскільки їхні методи `init()` повертають дані з однаковим базовим інтерфейсом.

Єдиний базовий інтерфейс для усіх розширень у групі - це важлива умова, оскільки інші розширення можуть очікувати дані із цієї групи, і вони будуть опиратись саме на цей базовий інтерфейс. Звичайно ж, базовий інтерфейс при потребі можна розширювати, але не звужувати.

У нашому прикладі, після того, як відпрацюють усі розширення з групи `ROUTES_EXTENSIONS`, їхні дані збираються в один масив і передаються до групи `PRE_ROUTER_EXTENSIONS`. Навіть якщо ви пізніше зареєструєте більше нових розширень у групі `ROUTES_EXTENSIONS`, все-одно група `PRE_ROUTER_EXTENSIONS` буде запускатись після того як відпрацюють абсолютно усі розширення з групи `ROUTES_EXTENSIONS`, включаючи ваші нові розширення.

Ця фіча є дуже зручною, оскільки вона інколи дозволяє інтегрувати зовнішні модулі Ditsmod (наприклад, з npmjs.com) у ваш застосунок без жодних налаштувань, просто імпортувавши їх у потрібний модуль. Саме завдяки групам розширень, імпортовані розширення будуть запускатись у правильній послідовності, навіть якщо вони імпортовані з різних зовнішніх модулів.

Так працює, наприклад, розширення з `@ditsmod/body-parser`. Ви просто імпортуєте `BodyParserModule`, і його розширення вже буде запускатись у правильному порядку, який прописаний у цьому модулі. В даному разі, його розширення буде працювати після групи `ROUTES_EXTENSIONS`, але перед групою `PRE_ROUTER_EXTENSIONS`. Причому зверніть увагу, що `BodyParserModule` і гадки не має, які саме розширення будуть працювати у цих групах, для нього важливим є лише:

1. інтерфейс даних, який будуть повертати розширення з групи `ROUTES_EXTENSIONS`;
2. порядок запуску, щоб роути не були встановлені ще до його роботи (тобто щоб група `PRE_ROUTER_EXTENSIONS` працювала саме після нього, а не перед ним).

Це означає, що `BodyParserModule` буде брати до уваги роути, що встановлені за допомогою декораторів `@Route()` або `@OasRoute()`, або будь-яких інших декораторів із цієї групи, оскільки їх обробкою займаються розширення, що працюють перед ним у групі `ROUTES_EXTENSIONS`.

### Створення токена нової групи

Токен групи розширень повинен бути інстансом класу `InjectionToken`.

Наприклад, щоб створити токен для групи `MY_EXTENSIONS`, необхідно зробити наступне:

```ts
import { InjectionToken } from '@ts-stack/di';
import { Extension } from '@ditsmod/core';

export const MY_EXTENSIONS = new InjectionToken<Extension<void>[]>('MY_EXTENSIONS');
```

Як бачите, кожна група розширень повинна указувати, що DI повертатиме масив інстансів розширень: `Extension<void>[]`. Це треба робити обов'язково, відмінність може бути хіба що в типі даних для дженеріка `Extension<T>[]`.

### Реєстрація розширення

В масив `extensions`, що знаходиться в метаданих модуля, можуть передаватись об'єкти наступного типу:

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

Властивість `nextToken` використовується, коли вашу групу розширень потрібно запускати перед іншою групою розширень:

```ts
import { Module, ROUTES_EXTENSIONS } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my.extension';

@Module({
  extensions: [
    { extension: MyExtension, groupToken: MY_EXTENSIONS, nextToken: ROUTES_EXTENSIONS, exported: true }
  ],
})
export class SomeModule {}
```

Тобто у властивість `groupToken` передається токен групи `MY_EXTENSIONS`, до якої належить ваше розширення. У властивість `nextToken` передається токен групи розширень `ROUTES_EXTENSIONS`, перед якою потрібно запускати групу `MY_EXTENSIONS`. Властивість `exported` вказує на те, чи потрібно експортувати дане розширення з поточного модуля.

Якщо ж для вашого розширення не важливо перед якою групою розширень воно працюватиме, можна спростити реєстрацію:

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

## Використання ExtensionsManager

Для спрощення, [Створення класу розширення][2] містить приклад, де вказано залежність `Extension2` від `Extension1`, але рекомендується указувати залежність саме від групи розширень, а не безпосередньо від конкретного розширенння. В такому разі, вам не потрібно знати імена усіх розширень, що входять у групу розширень, достатньо знати лише інтерфейс даних, які повертаються з `init()`.

`ExtensionsManager` використовується для запуску груп розширень, він також корисний тим, що кидає помилки про циклічні залежності між розширеннями, і показує весь ланцюжок розширень, що призвів до зациклення. Окрім цього, `ExtensionsManager` дозволяє збирати результати ініціалізації розширень з усього застосунку, а не лише із одного модуля.

Припустимо `MyExtension` повинно дочекатись завершення ініціалізації групи `OTHER_EXTENSIONS`. Щоб зробити це, у конструкторі треба указувати залежність від `ExtensionsManager`, а у `init()` викликати `init()` цього сервісу:

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

`ExtensionsManager` буде послідовно викликати ініціалізацію усіх розширень з указаної групи, а результат їхньої роботи повертатиме у вигляді масиву. Якщо розширення повертатимуть масиви, вони будуть автоматично змерджені у єдиний результуючий масив. Цю поведінку можна змінити, якщо другим аргументом у `init()` передати `false`:

```ts
await this.extensionsManager.init(OTHER_EXTENSIONS, false);
```

Важливо пам'ятати, що запуск `init()` певного розширення обробляє дані лише в контексті поточного модуля. Наприклад, якщо `MyExtension` імпортовано у три різні модулі, то Ditsmod буде послідовно обробляти ці три модулі із трьома різними інстансами `MyExtension`. Це означає, що один інстанс розширення зможе збирати дані лише з одного модуля.

У випадку, коли вам потрібно накопичувати результати роботи певного розширення з усіх модулів, необхідно робити наступне:

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

Тобто коли вам потрібно щоб `MyExtension` отримало дані з групи `OTHER_EXTENSIONS` з усього застосунку, третім аргументом тут потрібно передавати `MyExtension`:

```ts
const result = await this.extensionsManager.init(OTHER_EXTENSIONS, true, MyExtension);
```

Даний вираз буде повертати `false` до того часу, поки не буде викликано останній раз групу `OTHER_EXTENSIONS`. Наприклад, якщо група `OTHER_EXTENSIONS` працює у трьох різних модулях, то цей вираз у перших двох модулях повертатиме `false`, а у третьому - те значення, яке повинно повертати ця група розширень.

## Динамічне додавання провайдерів

Кожне розширення може вказати залежність від групи розширень `ROUTES_EXTENSIONS`, щоб динамічно додавати провайдери на рівні:

- модуля,
- роуту,
- запиту.

Можна проглянути як це зроблено у [BodyParserExtension][3]:

```ts
@Injectable()
export class BodyParserExtension implements Extension<void> {
  private inited: boolean;

  constructor(protected extensionManager: ExtensionsManager, protected injectorPerApp: InjectorPerApp) {}

  async init() {
    if (this.inited) {
      return;
    }

    // Отримуємо метадані, зібрані за допомогою групи розширень ROUTES_EXTENSIONS
    const aMetadataPerMod2 = await this.extensionManager.init(ROUTES_EXTENSIONS);

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      // Спочатку витягуємо метадані модуля
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;

      // Тепер витягуємо метадані контролера
      aControllersMetadata2.forEach(({ providersPerRou, providersPerReq }) => {
        // Зливаємо провайдери із модуля та контролера
        const mergedProvidersPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const mergedProvidersPerReq = [...metadataPerMod2.providersPerReq, ...providersPerReq];

        // Створюємо ієрархію інжекторів
        const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedProvidersPerRou);
        const injectorPerReq = injectorPerRou.resolveAndCreateChild(mergedProvidersPerReq);

        // Отримуємо метадані для роуту,
        // і на їх основі або додаємо інтерсептор до injectorPerReq, або - ні.
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

Звичайно ж, таке динамічне додавання провайдерів можливе лише перед стартом вебсервера.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/09-one-extension
[2]: #створення-класу-розширення
[3]: https://github.com/ditsmod/ditsmod/blob/0c4660a77/packages/body-parser/src/body-parser.extension.ts#L27-L40