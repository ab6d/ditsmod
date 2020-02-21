import 'reflect-metadata';
import { ReflectiveInjector } from '@ts-stack/di';

import { EntityManager } from './entity-manager';
import { RouteParam } from '../../../types/router';
import { Entity, DatabaseMetadata, DatabaseService } from '../decorators/entity';
import { EntityInjector } from '../services-per-app/entity-injector';

describe('EntityManager', () => {
  interface Req {
    routeParamsArr: RouteParam[];
  }

  class MockEntityManager extends EntityManager {}

  abstract class Model {
    prop1: number;
  }

  @Entity()
  class MysqlModel extends Model {
    static metadata: DatabaseMetadata;
    prop1: number;
  }

  class MyDatabaseService implements DatabaseService {
    query(...args: any[]) {
      return args;
    }
  }

  MysqlModel.metadata = { tableName: 'mysqlPost', primaryColumns: ['postId'], databaseService: MyDatabaseService };

  const injector = ReflectiveInjector.resolveAndCreate([MyDatabaseService, { provide: Model, useClass: MysqlModel }]);
  const req = { routeParamsArr: [{ key: 'postId', value: '12' }] } as Req;
  const entityInjector = (injector as unknown) as EntityInjector;
  const mock = new MockEntityManager(req as any, injector, entityInjector);

  describe('find()', () => {
    it('should return sql query', () => {
      expect(mock.find(Model)).toEqual(['select * from mysqlPost;', undefined]);
    });
  });

  describe('findOne()', () => {
    it('should return sql query', () => {
      expect(mock.findOne(Model)).toEqual(['select * from mysqlPost where postId = ?;', [req.routeParamsArr[0].value]]);
    });
  });
});
