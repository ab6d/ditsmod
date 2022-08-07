import { Inject, Injectable, InjectionToken, Injector, Type } from '@ts-stack/di';
import { getProviderName } from '../utils/get-provider-name';
import { isInjectionToken } from '../utils/type-guards';
import { EXTENSIONS_COUNTERS } from '../constans';

import { Extension, ExtensionsGroupToken } from '../types/mix';
import { Counter } from './counter';
import { ExtensionsContext } from './extensions-context';
import { LogMediator } from './log-mediator';

class InitedGroupCacheKey {
  constructor(
    public groupToken: ExtensionsGroupToken<any>,
    public autoMergeArrays?: boolean,
    public extension?: Type<Extension<any>>
  ) {}
}

class InitedGroupCache extends InitedGroupCacheKey {
  constructor(
    groupToken: ExtensionsGroupToken<any>,
    autoMergeArrays?: boolean,
    extension?: Type<Extension<any>>,
    public value: any[] = []
  ) {
    super(groupToken, autoMergeArrays, extension);
  }
}

@Injectable()
export class ExtensionsManager {
  protected unfinishedInit = new Set<Extension<any> | ExtensionsGroupToken<any>>();
  protected initedGroupCache: InitedGroupCache[] = [];
  protected moduleName: string = '';
  protected beforeTokens: string[] = [];

  constructor(
    private injector: Injector,
    private logMediator: LogMediator,
    private counter: Counter,
    private extensionsContext: ExtensionsContext,
    @Inject(EXTENSIONS_COUNTERS) private mExtensionsCounters: Map<Type<Extension<any>>, number>
  ) {}

  async startChainInit(initedGroupCacheKey: InitedGroupCacheKey, moduleName?: string, beforeTokens?: string[]) {
    const { groupToken, autoMergeArrays, extension } = initedGroupCacheKey;
    this.moduleName = moduleName || this.moduleName;
    this.beforeTokens = beforeTokens || this.beforeTokens;
    const beforeToken = `BEFORE ${groupToken}` as const;
    let cache = this.getCache({ groupToken: beforeToken, autoMergeArrays, extension });
    if (!cache && this.beforeTokens.includes(beforeToken)) {
      this.unfinishedInit.add(beforeToken);
      this.logMediator.startExtensionsGroupInit(this, this.moduleName, this.unfinishedInit);
      await this.init(beforeToken);
      this.logMediator.finishExtensionsGroupInit(this, this.moduleName, this.unfinishedInit);
      this.unfinishedInit.delete(beforeToken);
    }

    cache = this.getCache({ groupToken, autoMergeArrays, extension });
    if (cache) {
      return;
    }
    this.unfinishedInit.add(groupToken);
    this.logMediator.startExtensionsGroupInit(this, this.moduleName, this.unfinishedInit);
    await this.init(groupToken);
    this.logMediator.finishExtensionsGroupInit(this, this.moduleName, this.unfinishedInit);
    this.unfinishedInit.delete(groupToken);
  }

  // prettier-ignore
  async init<T>(groupToken: ExtensionsGroupToken<T>, autoMergeArrays: boolean, extension: Type<Extension<any>>): Promise<T[] | false>;
  // prettier-ignore
  async init<T>(groupToken: ExtensionsGroupToken<T>, autoMergeArrays?: boolean, extension?: Type<Extension<any>>): Promise<T[]>;
  // prettier-ignore
  async init<T>(groupToken: ExtensionsGroupToken<T>, autoMergeArrays = true, extension?: Type<Extension<any>>): Promise<T[] | false> {
    const lastItem = [...this.unfinishedInit].pop();
    if (lastItem && !isInjectionToken(lastItem) && typeof lastItem != 'string') {
      if (this.unfinishedInit.has(groupToken)) {
        this.throwCircularDeps(groupToken);
      }
      if (typeof groupToken != 'string') {
        await this.startChainInit({ groupToken, autoMergeArrays, extension });
      }
    }
    const cache = this.getCache({ groupToken, autoMergeArrays, extension });
    if (cache) {
      return cache.value;
    }
    const extensions = this.injector.get(groupToken, []) as Extension<T>[];
    const aCurrentData: T[] = [];

    if (!extensions.length) {
      this.logMediator.noExtensionsFound(this, groupToken);
    }

    for (const extension of extensions) {
      if (this.unfinishedInit.has(extension)) {
        this.throwCircularDeps(extension);
      }

      this.unfinishedInit.add(extension);
      this.logMediator.startInitExtension(this, this.unfinishedInit);
      const isLastExtensionCall = this.mExtensionsCounters.get(extension.constructor as Type<Extension<T>>) === 0;
      const data = await extension.init(isLastExtensionCall);
      this.logMediator.finishInitExtension(this, this.unfinishedInit, data);
      this.counter.addInitedExtensions(extension);
      this.unfinishedInit.delete(extension);
      if (data === undefined) {
        continue;
      }
      if (autoMergeArrays && Array.isArray(data)) {
        aCurrentData.push(...data);
      } else {
        aCurrentData.push(data);
      }
    }

    let value: any[] = [];
    if (extension) {
      const valueOrFalse = this.getDataFromAllModules(groupToken, extension, aCurrentData);
      if (valueOrFalse === false) {
        return false;
      } else {
        value = valueOrFalse;
      }
    } else {
      value = aCurrentData;
    }

    const newCache = new InitedGroupCache(groupToken, autoMergeArrays, extension, value);
    this.initedGroupCache.push(newCache);

    return value;
  }

  protected getCache(initedGroupCacheKey: InitedGroupCacheKey) {
    const { groupToken, autoMergeArrays, extension } = initedGroupCacheKey;
    return this.initedGroupCache.find((item) => {
      return item.groupToken == groupToken && item.autoMergeArrays == autoMergeArrays && item.extension === extension;
    });
  }

  protected getDataFromAllModules<T>(
    groupToken: ExtensionsGroupToken<T>,
    extension: Type<Extension<T>>,
    aCurrentData: T[]
  ) {
    const { mExtensionsData: mAllExtensionsData } = this.extensionsContext;
    const mExtensionData = mAllExtensionsData.get(extension);
    const aGroupData = mExtensionData?.get(groupToken);
    const isLastExtensionCall = this.mExtensionsCounters.get(extension) === 0;

    if (isLastExtensionCall) {
      if (aGroupData) {
        return [...aGroupData, ...aCurrentData];
      } else {
        return aCurrentData;
      }
    } else {
      if (!mExtensionData) {
        mAllExtensionsData.set(extension, new Map([[groupToken, aCurrentData]]));
      } else {
        if (aGroupData) {
          aGroupData.push(...aCurrentData);
        } else {
          mExtensionData.set(groupToken, aCurrentData);
        }
      }
      return false;
    }
  }

  protected throwCircularDeps(item: Extension<any> | ExtensionsGroupToken<any>) {
    const items = Array.from(this.unfinishedInit);
    const index = items.findIndex((ext) => ext === item);
    const prefixChain = items.slice(0, index);
    const circularChain = items.slice(index);
    const prefixNames = prefixChain.map(this.getItemName).join(' -> ');
    let circularNames = circularChain.map(this.getItemName).join(' -> ');
    circularNames += ` -> ${this.getItemName(item)}`;
    let msg = `Detected circular dependencies: ${circularNames}.`;
    if (prefixNames) {
      msg += ` It is started from ${prefixNames}.`;
    }
    throw new Error(msg);
  }

  protected getItemName(tokenOrExtension: Extension<any> | ExtensionsGroupToken<any>) {
    if (isInjectionToken(tokenOrExtension) || typeof tokenOrExtension == 'string') {
      return getProviderName(tokenOrExtension);
    } else {
      return tokenOrExtension.constructor.name;
    }
  }
}
