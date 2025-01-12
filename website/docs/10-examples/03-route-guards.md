# 03-route-guards

Щоб спробувати даний приклад, необхідно спочатку [підготувати передумови](./prerequisite).

У цьому прикладі, в кореневий модуль імпортується `SomeModule`, де є контролер із захищеними маршрутами. Захист даних маршрутів відбуваєтья за допомогою [ґардів (guards)][103]. Ці ґарди знаходяться в `AuthModule`, а сам модуль експортується із кореневого модуля. Експорт модулів стосується виключно провайдерів для DI. Не має сенсу експортувати модулі, якщо вам не потрібні провайдери з них.

Разом із тим, якщо ви робите [експорт певного модуля із кореневого модуля][102], його провайдери копіюються у кожен модуль застосунку. Саме це і відбувається у модулі `AuthModule`.

В `SomeController` показано два варіанти використання ґардів. Перший варіант без аргументів:

```ts
@route('GET', 'unauth', [AuthGuard])
throw401Error(res: Res) {
  res.send('some secret');
}
```

Другий варіант з аргументами:

```ts
@route('GET', 'forbidden', [[PermissionsGuard, Permission.canActivateAdministration]])
throw403Error(res: Res) {
  res.send('some secret');
}
```

Можете запустити застосунок з першого терміналу:

```bash
yarn start3
```

З другого терміналу перевірити роботу:

```bash
curl -isS localhost:3000
curl -isS localhost:3000/unauth
curl -isS localhost:3000/forbidden
```

[102]: /components-of-ditsmod-app/exports-and-imports#експорт-провайдерів-із-кореневого-модуля
[103]: /components-of-ditsmod-app/guards
