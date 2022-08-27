import { MsgLogFilter, LogMediator } from '@ditsmod/core';
import { ISO639 } from './types/iso-639';

export class I18nLogMediator extends LogMediator {
  /**
   * ${className}: in ${moduleName} translation not found.
   */
  translationNotFound(self: object, moduleName: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    msgLogFilter.tags = ['i18n', 'locales'];
    this.setLog('warn', msgLogFilter, `${className}: in ${moduleName} translation not found.`);
  }
  /**
   * ${className}: in ${extendedClassName} missing methods: [${methods}].
   */
  missingMethods(self: object, extendedClassName: string, missingMethods: string[]) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    msgLogFilter.tags = ['i18n', 'locales'];
    const methods = missingMethods.join(', ');
    this.setLog('debug', msgLogFilter, `${className}: in ${extendedClassName} missing methods: [${methods}].`);
  }
  /**
   * ${className}: in ${dictName} missing locale "${lng}".
   */
  missingLng(self: object, dictName: string, lng: ISO639) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    msgLogFilter.tags = ['i18n', 'locales'];
    this.setLog('debug', msgLogFilter, `${className}: in ${dictName} missing locale "${lng}".`);
  }
  /**
   * ${className}: in "moduleName -> tokenName" found locales: [...]. Some methods: [...].
   */
  foundLngs(self: object, tokenName: string, allLngs: string[], methods: string[]) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    msgLogFilter.tags = ['i18n', 'locales'];
    let msg = `${className}: in "${this.moduleName} -> ${tokenName}" found locales: [${allLngs.join(', ')}].`;
    if (methods.length) {
      msg += ` Some methods: [${methods.join(', ')}].`;
    } else {
      msg += ` No methods found.`;
    }
    this.setLog('debug', msgLogFilter, msg);
  }
  /**
   * className: found overrides in "moduleName -> tokenName" for locales: [...]. Some methods: [...].
   */
  overridedLngs(self: object, tokenName: string, allLngs: string[], methods: string[]) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    msgLogFilter.tags = ['i18n', 'locales'];
    let msg = `${className}: found overrides in "${this.moduleName} -> ${tokenName}" for locales: [${allLngs.join(', ')}].`;
    if (methods.length) {
      msg += ` Some methods: [${methods.join(', ')}].`;
    } else {
      msg += ` No methods found.`;
    }
    this.setLog('debug', msgLogFilter, msg);
  }
}
