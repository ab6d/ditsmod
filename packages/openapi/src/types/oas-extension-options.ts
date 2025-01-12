import { XOasObject } from '@ts-stack/openapi-spec';
import { SwaggerOAuthOptions } from '../swagger-ui/swagger-o-auth-options';

/**
 * Internaly used options.
 */
export class OasExtensionOptions {
  oasObject?: XOasObject;
  swaggerOAuthOptions?: SwaggerOAuthOptions;
}

export class OasConfigFiles {
  json: string;
  yaml: string;
}
