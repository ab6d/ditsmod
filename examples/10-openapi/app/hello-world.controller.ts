import { Controller, Request, Response, Route, Status } from '@ditsmod/core';
import { OasRoute } from '@ditsmod/openapi';

@Controller()
export class HelloWorldController {
  constructor(private req: Request, private res: Response) {}

  // Here works route decorator from `@ditsmod/core`.
  @Route('GET')
  hello() {
    this.res.send('ok\n');
  }

  // Here works new route decorator from `@ditsmod/openapi`.
  @OasRoute('posts/{postId}', [], {
    parameters: [
      { in: 'path', name: 'postId', required: true },
      { in: 'query', name: 'catId' },
    ],
    get: {
      parameters: [
        { in: 'query', name: 'rubricId' },
        { in: 'query', name: 'contextId' },
      ],
      responses: {
        [Status.OK]: {
          description: 'List of posts',
          content: { ['application/json']: { schema: { $ref: '' } } },
        },
      },
    },
  })
  getPosts() {
    const pathParams = this.req.pathParamsArr.map((p) => `{${p.key}: ${p.value}}`).join(', ');
    this.res.send(`Request have pathParams: "${pathParams}", and Response returns single post\n`);
  }

  @OasRoute('posts/{postId}/comments/{commentId}', [], {
    get: {
      parameters: [
        { in: 'path', name: 'postId', required: true },
        { in: 'path', name: 'commentId', required: true },
      ],
      responses: {
        [Status.OK]: {
          description: 'Post to read',
          content: {
            'application/json': { schema: { $ref: '' } },
          },
        },
      },
    },
  })
  getPost() {
    const pathParams = this.req.pathParamsArr.map((p) => `{${p.key}: ${p.value}}`).join(', ');
    this.res.send(`Request have pathParams: "${pathParams}", and Response returns single comment\n`);
  }
}