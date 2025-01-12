import { readFile } from 'fs/promises';
import { controller, Status, Res } from '@ditsmod/core';

import { oasRoute } from './decorators/oas-route';
import { SwaggerConfigManager } from './services/swagger-config-manager';
import { OasConfigFiles } from './types/oas-extension-options';

@controller()
export class OpenapiController {
  constructor(private swaggerConfigManager: SwaggerConfigManager, private configFiles: OasConfigFiles, private res: Res) {}

  @oasRoute('GET', 'openapi', [], {
    description: 'OpenAPI documentation',
    parameters: [],
    responses: {
      [Status.OK]: {
        description: 'Index file for the OpenAPI Specification',
        content: { ['text/html; charset=utf-8']: {} },
      },
    },
  })
  async getIndex() {
    await this.swaggerConfigManager.applyConfig();
    const indexHtml = await readFile(`${this.swaggerConfigManager.webpackDist}/index.html`, 'utf8');
    this.res.setContentType('text/html; charset=utf-8').send(indexHtml);
  }

  @oasRoute('GET', 'openapi.yaml', [], {
    description: 'Config file in YAML format for the OpenAPI documentation',
    parameters: [],
    responses: {
      [Status.OK]: {
        description: 'YAML-file for the OpenAPI documentation',
        content: { ['text/yaml; charset=utf-8']: {} },
      },
    },
  })
  async getYaml() {
    this.res.setContentType('text/yaml; charset=utf-8').send(this.configFiles.yaml);
  }

  @oasRoute('GET', 'openapi.json', [], {
    description: 'Config file in JSON format for the OpenAPI documentation',
    parameters: [],
    responses: {
      [Status.OK]: {
        description: 'JSON-file for the OpenAPI documentation',
        content: { ['application/json; charset=utf-8']: {} },
      },
    },
  })
  async getJson() {
    this.res.setContentType('application/json; charset=utf-8').send(this.configFiles.json);
  }

  @oasRoute('GET', 'openapi.bundle.js', [], {
    description: 'SwaggerUI JavaScript bundle',
    parameters: [],
    responses: {
      [Status.OK]: {
        description: 'JavaScript-file with SwaggerUI logic',
        content: { ['text/javascript; charset=utf-8']: {} },
      },
    },
  })
  async getJavaScript() {
    const appBundle = await readFile(`${this.swaggerConfigManager.webpackDist}/openapi.bundle.js`, 'utf8');
    this.res.setContentType('text/javascript; charset=utf-8').send(appBundle);
  }
}
