---
sidebar_position: 1
---

# @ditsmod/body-parser

Цей модуль додає інтерсептор для парсінгу тіла запиту до усіх роутів, що мають HTTP-методи вказані у `bodyParserConfig.acceptMethods`, по-дефолту це:

- `POST`
- `PUT`
- `PATCH`

Підтримуються наступні типи даних:

- `application/json`
- `application/x-www-form-urlencoded`
- `text/plain`
- `text/html`

Даний модуль не парсить тіло запиту при завантаженні файлів, для цього можете скористатись стороннім модулем [multiparty][2].

## Встановлення

```bash
yarn add @ditsmod/body-parser
```

## Підключення

Щоб глобально підключити `@ditsmod/body-parser`, потрібно імпортувати та експортувати `BodyParserModule` в кореневому модулі:

```ts
import { rootModule } from '@ditsmod/core';
import { BodyParserModule } from '@ditsmod/body-parser';

@rootModule({
  imports: [
    BodyParserModule,
    // ...
  ],
  exports: [BodyParserModule]
})
export class AppModule {}
```

В такому разі будуть працювати дефолтні налаштування. Якщо ж вам потрібно змінити деякі опції, можете це зробити наступним чином:

```ts {4}
import { rootModule } from '@ditsmod/core';
import { BodyParserModule } from '@ditsmod/body-parser';

const moduleWithBodyParserConfig = BodyParserModule.withParams({ maxBodySize: 1024 * 1024 });

@rootModule({
  imports: [
    moduleWithBodyParserConfig,
    // ...
  ],
  exports: [moduleWithBodyParserConfig]
})
export class AppModule {}
```

Ще один варіант передачі конфігурації:

```ts
import { rootModule, Providers } from '@ditsmod/core';
import { BodyParserModule, BodyParserConfig } from '@ditsmod/body-parser';

@rootModule({
  imports: [
    BodyParserModule,
    // ...
  ],
  providersPerApp: [
    ...new Providers()
      .useValue<BodyParserConfig>(BodyParserConfig,  { maxBodySize: 1024*1024 })
  ],
  exports: [BodyParserModule]
})
export class AppModule {}
```

## Використання

Результат роботи інтерсептора можна отримати за допомогою токена `HTTP_BODY`:

```ts {11}
import { controller, Res, route, inject } from '@ditsmod/core';
import { HTTP_BODY } from '@ditsmod/body-parser';

interface Body {
  one: number;
}

@controller()
export class SomeController {
  @route('POST')
  ok(@inject(HTTP_BODY) body: Body, res: Res) {
    res.sendJson(body);
  }
}
```



[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/06-body-parser
[2]: https://www.npmjs.com/package/@ts-stack/multiparty
