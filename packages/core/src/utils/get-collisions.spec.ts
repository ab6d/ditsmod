import 'reflect-metadata';

import { ServiceProvider } from '../types/mix';
import { getCollisions } from './get-collisions';

describe('getTokensCollisions()', () => {
  it('duplicates are identical', () => {
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    let duplTokens: any[] = [Provider1, Provider2];
    const providers: ServiceProvider[] = [Provider1, Provider2, Provider4, Provider3, Provider5, Provider2, Provider1];
    duplTokens = getCollisions(duplTokens, providers);
    expect(duplTokens).toEqual([]);
  });

  it('duplicates are non identical and non equal', () => {
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}
    let duplTokens: any[] = [Provider3, Provider7];
    const providers: ServiceProvider[] = [
      Provider4,
      Provider3,
      Provider5,
      Provider3,
      { provide: Provider3, useClass: Provider3 },
      { provide: Provider7, useClass: Provider7 },
      { provide: Provider7, useClass: Provider6 },
    ];
    duplTokens = getCollisions(duplTokens, providers);
    expect(duplTokens).toEqual([Provider3, Provider7]);
  });

  it('non-identical class providers, but equal', () => {
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}
    let duplTokens: any[] = [Provider6];
    const providers: ServiceProvider[] = [
      Provider4,
      Provider3,
      Provider5,
      { provide: Provider6, useClass: Provider7 },
      { provide: Provider6, useClass: Provider7 },
      { provide: Provider7, useClass: Provider7 },
    ];
    duplTokens = getCollisions(duplTokens, providers);
    expect(duplTokens).toEqual([]);
  });

  it('non-identical factory providers, but equal', () => {
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}
    let duplTokens: any[] = [Provider6];
    function factory() {
      return new Provider7();
    }
    const providers: ServiceProvider[] = [
      Provider4,
      Provider3,
      Provider5,
      { provide: Provider6, useFactory: factory },
      { provide: Provider6, useFactory: factory },
      { provide: Provider7, useClass: Provider7 },
    ];
    duplTokens = getCollisions(duplTokens, providers);
    expect(duplTokens).toEqual([]);
  });
});