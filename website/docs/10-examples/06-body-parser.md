# 06-body-parser

Щоб спробувати даний приклад, необхідно спочатку [підготувати передумови](./prerequisite).

Можете запустити застосунок з першого терміналу:

```bash
yarn start6
```

З другого терміналу перевірити роботу:

```bash
curl -isS localhost:3000 -d '{"one":1}' -H 'content-type: application/json'
```
