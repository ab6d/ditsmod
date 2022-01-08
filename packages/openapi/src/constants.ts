import { deepFreeze } from '@ditsmod/core';
import { openapi, XOasObject } from '@ts-stack/openapi-spec';

export const DEFAULT_OAS_OBJECT: XOasObject = {
  openapi,
  servers: [{ url: 'http://localhost:3000' }],
  info: { title: 'Testing @ditsmod/openapi with default value', version: '0.0.0' },
  tags: [
    {
      name: 'NonOasRoutes',
      description:
        'Routes that use a decorator `@Route()`. If you want to change this description, ' +
        '[use tags](https://swagger.io/docs/specification/grouping-operations-with-tags/) ' +
        'for `@OasRoute()` imported from @ditsmod/openapi.',
    },
  ],
  components: {}
};

deepFreeze(DEFAULT_OAS_OBJECT);
