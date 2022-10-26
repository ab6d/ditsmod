---
sidebar_position: 4
title: OPTIONS та CORS
---

# @ditsmod/cors

Якщо ваш застосунок потребує використання HTTP-методу [OPTIONS][1] чи механізмів [CORS][2] або [preflight CORS][3], можна використовувати модуль `@ditsmod/cors`.

## Встановлення

```bash
yarn add @ditsmod/cors
```

## Робота з дефолтними налаштуваннями

Готовий приклад з `@ditsmod/cors` можна проглянути [в репозиторії Ditsmod][4].

Модуль може працювати з дефолтними налаштуваннями зразу після імпорту:

```ts
import { Module } from '@ditsmod/core';
import { CorsModule } from '@ditsmod/cors';

@Module({
  imports: [
    CorsModule,
    // ...
  ],
  // ...
})
export class SomeModule {}
```

Тепер усі роути в `SomeModule` будуть доповнені новими роутами з HTTP-методом `OPTIONS`. Тобто, якщо `SomeModule` має роути `GET /users` та `GET /posts`, то вони будуть автоматично доповнені роутами `OPTIONS /users` та `OPTIONS /posts`.

Можете перевірити роботу цього модуля приблизно такими запитами:

```bash
# Simply OPTIONS request
curl -isS localhost:3000 -X OPTIONS

# OPTIONS CORS request
curl -isS localhost:3000 -X OPTIONS -H 'Origin: https://example.com'

# GET CORS request
curl -isS localhost:3000 -H 'Origin: https://example.com'

# CORS Preflight request
curl -isS localhost:3000 \
-X OPTIONS \
-H 'Origin: https://example.com' \
-H 'Access-Control-Request-Method: POST' \
-H 'Access-Control-Request-Headers: X-PINGOTHER, Content-Type'

# CORS request with credentials
curl -isS localhost:3000/credentials
```

## Робота з кастомними налаштуваннями

Якщо ви хочете змінити дефолтні налаштування, при імпорті можете передати деякі опції, які будуть братись до уваги на рівні модуля:

```ts
import { Module } from '@ditsmod/core';
import { CorsModule } from '@ditsmod/cors';

@Module({
  imports: [
    CorsModule.withParams({ origin: 'https://example.com' }),
    // ...
  ],
  // ...
})
export class SomeModule {}
```

Також є можливість передати CORS-опції на рівні роуту:

```ts
import { Module, Providers } from '@ditsmod/core';
import { CorsModule, CorsOpts } from '@ditsmod/cors';

@Module({
  imports: [
    CorsModule,
    // ...
  ],
  providersPerRou: [
    ...new Providers()
      .useValue<CorsOpts>(CorsOpts, { origin: 'https://example.com' }),
    // ...
  ],
  // ...
})
export class SomeModule {}
```

## Робота з куками під час CORS-запитів

Коли вам потрібно щоб CORS HTTP-відповідь містила куки, і ці куки приймались веб-браузерами, можна скористатись `CorsService`:

```ts
import { Controller, Res, Route } from '@ditsmod/core';
import { CorsService } from '@ditsmod/cors';

@Controller()
export class SomeController {
  constructor(private res: Res, private corsService: CorsService) {}

  @Route('GET')
  getMethod() {
    this.corsService.setCookie('one', 'value for one');
    this.res.send('Some response');
  }
}
```

Як бачите, кука встановлюється за допомогою методу `setCookie()`. В такому разі відповідь міститиме заголовок `Access-Control-Allow-Credentials: true`.




[1]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/OPTIONS
[2]: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
[3]: https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request
[4]: https://github.com/ditsmod/ditsmod/tree/main/examples/17-cors