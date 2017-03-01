 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const debug = require('debug')('ReactNativePackager:DependencyGraph');
const util = require('util');
const path = require('path');
const fs = require('fs'); // @Denis
const isAbsolutePath = require('absolute-path');
const getAssetDataFromName = require('../lib/getAssetDataFromName');
const Promise = require('promise');
// @Denis 获取react-native自带的依赖组件
// const coreDependencies = require(process.cwd() + '/node_modules/rn-core/package.json').dependencies;

let coreModulesList = [];
// @Denis 获取模块名单
if (fs.existsSync(path.join(process.cwd(), 'coreModulesList.js'))) {
  coreModulesList = require(process.cwd() + '/coreModulesList');
} else {
  coreModulesList = require(process.cwd() + '/node_modules/rn-core/coreModulesList');
}

class ResolutionRequest {
  constructor({
    platform,
    includeFramework, // @Denis
    preferNativePlatform,
    entryPath,
    hasteMap,
    deprecatedAssetMap,
    helpers,
    moduleCache,
    fastfs,
    shouldThrowOnUnresolvedErrors,
  }) {
    this._platform = platform;
    this._includeFramework = includeFramework;  // @Denis
    this._preferNativePlatform = preferNativePlatform;
    this._entryPath = entryPath;
    this._hasteMap = hasteMap;
    this._deprecatedAssetMap = deprecatedAssetMap;
    this._helpers = helpers;
    this._moduleCache = moduleCache;
    this._fastfs = fastfs;
    this._shouldThrowOnUnresolvedErrors = shouldThrowOnUnresolvedErrors;
    this._resetResolutionCache();
    // @Denis
    this._depModules = []; // 存放打包模块名称
    // this._whiteResolvedDependencies = {};
    // this._whiteDependencies = {};
  }

  _tryResolve(action, secondaryAction) {
    return action().catch((error) => {
      if (error.type !== 'UnableToResolveError') {
        throw error;
      }
      return secondaryAction();
    });
  }

  resolveDependency(fromModule, toModuleName) {
    const resHash = resolutionHash(fromModule.path, toModuleName);

    // @Denis
    // console.log(resHash);
    if (this._immediateResolutionCache[resHash]) {
      return Promise.resolve(this._immediateResolutionCache[resHash]);
    }

    const asset_DEPRECATED = this._deprecatedAssetMap.resolve(
      fromModule,
      toModuleName
    );
    if (asset_DEPRECATED) {
      return Promise.resolve(asset_DEPRECATED);
    }

    const cacheResult = (result) => {
      // @Denis 标记核心框架依赖模块
      // if (coreDependencies[toModuleName]) {
      //   if (this._whiteResolvedDependencies[toModuleName]) {
      //     if(!this._whiteDependencies[result.path]) {
      //       // console.log('Disable module:', toModuleName, ' path: ', result.path);
      //       this._whiteDependencies[result.path] = 'disable';
      //     }
      //   } else {
      //     this._whiteResolvedDependencies[toModuleName] = true;
      //     // console.log('Enable module: ', toModuleName, ' path: ', result.path);
      //     this._whiteDependencies[result.path] = 'enable';
      //   }
      // }
      this._immediateResolutionCache[resHash] = result;
      return result;
    };

    const forgive = (error) => {
      if (
        error.type !== 'UnableToResolveError' ||
        this._shouldThrowOnUnresolvedErrors(this._entryPath, this._platform)
      ) {
        throw error;
      }

      debug(
        'Unable to resolve module %s from %s',
        toModuleName,
        fromModule.path
      );
      return null;
    };

    // @Denis 分析多级依赖时的模块名称，符合黑名单中的模块，都走这个逻辑
    if ((!this._includeFramework
        && coreModulesList.indexOf(toModuleName.split('/')[0]) > -1) ||
      (!this._helpers.isNodeModulesDir(fromModule.path)
        && toModuleName[0] !== '.' &&
        toModuleName[0] !== '/')) {
      return this._tryResolve(
        () => this._resolveHasteDependency(fromModule, toModuleName),
        () => this._resolveNodeDependency(fromModule, toModuleName)
      ).then(
        cacheResult,
        forgive,
      );
    }

    return this._tryResolve(
      () => this._resolveNodeDependency(fromModule, toModuleName),
      () => this._resolveHasteDependency(fromModule, toModuleName)
    ).then(
      cacheResult,
      forgive,
    );
  }
  getOrderedDependencies(response, mocksPattern, recursive = true) {
    const self = this;
    return this._getAllMocks(mocksPattern).then(allMocks => {
      const entry = this._moduleCache.getModule(this._entryPath);
      const mocks = Object.create(null);
      const visited = Object.create(null);
      visited[entry.hash()] = true;

      response.pushDependency(entry);
      // @Denis
      console.log("分析依赖模块路径(实际打包的模块): ");
      const collect = (mod) => {
        console.log("> ", mod.path);
        return mod.getDependencies().then(
          depNames => Promise.all(
            depNames.map(name => this.resolveDependency(mod, name))
          ).then((dependencies) => [depNames, dependencies])
        ).then(([depNames, dependencies]) => {
          if (allMocks) {
            const list = [mod.getName()];
            const pkg = mod.getPackage();
            if (pkg) {
              list.push(pkg.getName());
            }
            return Promise.all(list).then(names => {
              names.forEach(name => {
                if (allMocks[name] && !mocks[name]) {
                  const mockModule =
                    this._moduleCache.getModule(allMocks[name]);
                  depNames.push(name);
                  dependencies.push(mockModule);
                  mocks[name] = allMocks[name];
                }
              });
              return [depNames, dependencies];
            });
          }
          return Promise.resolve([depNames, dependencies]);
        }).then(([depNames, dependencies]) => {
          let p = Promise.resolve();
          const filteredPairs = [];

          dependencies.forEach((modDep, i) => {
            const name = depNames[i];
            if (modDep == null) {
              // It is possible to require mocks that don't have a real
              // module backing them. If a dependency cannot be found but there
              // exists a mock with the desired ID, resolve it and add it as
              // a dependency.
              if (allMocks && allMocks[name] && !mocks[name]) {
                const mockModule = this._moduleCache.getModule(allMocks[name]);
                mocks[name] = allMocks[name];
                return filteredPairs.push([name, mockModule]);
              }

              debug(
                'WARNING: Cannot find required module `%s` from module `%s`',
                name,
                mod.path
              );
              return false;
            }
            return filteredPairs.push([name, modDep]);
          });

          response.setResolvedDependencyPairs(mod, filteredPairs);

          filteredPairs.forEach(([depName, modDep]) => {
            p = p.then(() => {
              if (!visited[modDep.hash()]) {
                visited[modDep.hash()] = true;

                // @Denis 业务打包时，跳过rn-core下的框架模块
                // if (!self._includeFramework && /\/rn-core\//.test(modDep.path)) {
                //   return null;
                // }
                // @Denis 业务打包时，跳过 coreModulesList 内的模块
                if (!self._includeFramework && coreModulesList.indexOf(depName) > -1) {
                  return null;
                }
                // @Denis 记录已经加入dep的模块名，防止同名不同路径的模块重复打入
                if (this._depModules.indexOf(depName) > -1) {
                  // bug: https://github.com/react-component/m-date-picker
                  //return null;
                } else {
                  this._depModules.push(depName);
                }
                // 不再打包与react-native依赖重名，但路径不同的模块。比如 react-timer-mixin
                // if(self._whiteDependencies[modDep.path] === 'disable') {
                //   return null;
                // }
                // 只打业务包的时候，不再打包与react-native依赖重名的模块
                // if (!self._includeFramework && self._whiteDependencies[modDep.path] === 'enable') {
                //   return null;
                // }

                response.pushDependency(modDep);
                if (recursive) {
                  return collect(modDep);
                }
              }
              return null;
            });
          });

          return p;
        });
      };

      return collect(entry).then(() => response.setMocks(mocks));
    });
  }

  _getAllMocks(pattern) {
    // Take all mocks in all the roots into account. This is necessary
    // because currently mocks are global: any module can be mocked by
    // any mock in the system.
    let mocks = null;
    if (pattern) {
      mocks = Object.create(null);
      this._fastfs.matchFilesByPattern(pattern).forEach(file =>
        mocks[path.basename(file, path.extname(file))] = file
      );
    }
    return Promise.resolve(mocks);
  }

  _resolveHasteDependency(fromModule, toModuleName) {
    toModuleName = normalizePath(toModuleName);

    let p = fromModule.getPackage();
    if (p) {
      p = p.redirectRequire(toModuleName);
    } else {
      p = Promise.resolve(toModuleName);
    }

    return p.then((realModuleName) => {
      let dep = this._hasteMap.getModule(realModuleName, this._platform);
      if (dep && dep.type === 'Module') {
        return dep;
      }

      let packageName = realModuleName;
      while (packageName && packageName !== '.') {
        dep = this._hasteMap.getModule(packageName, this._platform);
        if (dep && dep.type === 'Package') {
          break;
        }
        packageName = path.dirname(packageName);
      }

      if (dep && dep.type === 'Package') {
        const potentialModulePath = path.join(
          dep.root,
          path.relative(packageName, realModuleName)
        );
        return this._tryResolve(
          () => this._loadAsFile(
            potentialModulePath,
            fromModule,
            toModuleName,
          ),
          () => this._loadAsDir(potentialModulePath, fromModule, toModuleName),
        );
      }

      throw new UnableToResolveError(
        fromModule,
        toModuleName,
        'Unable to resolve dependency',
      );
    });
  }

  _redirectRequire(fromModule, modulePath) {
    return Promise.resolve(fromModule.getPackage()).then(p => {
      if (p) {
        return p.redirectRequire(modulePath);
      }
      return modulePath;
    });
  }

  _resolveFileOrDir(fromModule, toModuleName) {
    const potentialModulePath = isAbsolutePath(toModuleName) ?
        toModuleName :
        path.join(path.dirname(fromModule.path), toModuleName);

    return this._redirectRequire(fromModule, potentialModulePath).then(
      realModuleName => this._tryResolve(
        () => this._loadAsFile(realModuleName, fromModule, toModuleName),
        () => this._loadAsDir(realModuleName, fromModule, toModuleName)
      )
    );
  }

  _resolveNodeDependency(fromModule, toModuleName) {
    if (toModuleName[0] === '.' || toModuleName[1] === '/') {
      return this._resolveFileOrDir(fromModule, toModuleName);
    } else {
      return this._redirectRequire(fromModule, toModuleName).then(
        realModuleName => {
          if (realModuleName[0] === '.' || realModuleName[1] === '/') {
            // derive absolute path /.../node_modules/fromModuleDir/realModuleName
            const fromModuleParentIdx = fromModule.path.lastIndexOf('node_modules/') + 13;
            const fromModuleDir = fromModule.path.slice(0, fromModule.path.indexOf('/', fromModuleParentIdx));
            const absPath = path.join(fromModuleDir, realModuleName);
            return this._resolveFileOrDir(fromModule, absPath);
          }

          const searchQueue = [];
          for (let currDir = path.dirname(fromModule.path);
               currDir !== path.parse(fromModule.path).root;
               currDir = path.dirname(currDir)) {
            searchQueue.push(
              path.join(currDir, 'node_modules', realModuleName)
            );
          }

          let p = Promise.reject(new UnableToResolveError(
            fromModule,
            toModuleName,
            'Node module not found',
          ));
          searchQueue.forEach(potentialModulePath => {
            p = this._tryResolve(
              () => this._tryResolve(
                () => p,
                () => this._loadAsFile(potentialModulePath, fromModule, toModuleName),
              ),
              () => this._loadAsDir(potentialModulePath, fromModule, toModuleName)
            );
          });

          return p;
        });
    }
  }

  _loadAsFile(potentialModulePath, fromModule, toModule) {
    return Promise.resolve().then(() => {
      if (this._helpers.isAssetFile(potentialModulePath)) {
        const dirname = path.dirname(potentialModulePath);
        if (!this._fastfs.dirExists(dirname)) {
          throw new UnableToResolveError(
            fromModule,
            toModule,
            `Directory ${dirname} doesn't exist`,
          );
        }

        const {name, type} = getAssetDataFromName(potentialModulePath);

        let pattern = '^' + name + '(@[\\d\\.]+x)?';
        if (this._platform != null) {
          pattern += '(\\.' + this._platform + ')?';
        }
        pattern += '\\.' + type;

        // We arbitrarly grab the first one, because scale selection
        // will happen somewhere
        const [assetFile] = this._fastfs.matches(
          dirname,
          new RegExp(pattern)
        );

        if (assetFile) {
          return this._moduleCache.getAssetModule(assetFile);
        }
      }

      let file;
      if (this._fastfs.fileExists(potentialModulePath)) {
        file = potentialModulePath;
      } else if (this._platform != null &&
                 this._fastfs.fileExists(potentialModulePath + '.' + this._platform + '.js')) {
        file = potentialModulePath + '.' + this._platform + '.js';
      } else if (this._preferNativePlatform &&
                 this._fastfs.fileExists(potentialModulePath + '.native.js')) {
        file = potentialModulePath + '.native.js';
      } else if (this._fastfs.fileExists(potentialModulePath + '.js')) {
        file = potentialModulePath + '.js';
      } else if (this._fastfs.fileExists(potentialModulePath + '.json')) {
        file = potentialModulePath + '.json';
      } else {
        throw new UnableToResolveError(
          fromModule,
          toModule,
          `File ${potentialModulePath} doesnt exist`,
        );
      }

      return this._moduleCache.getModule(file);
    });
  }

  _loadAsDir(potentialDirPath, fromModule, toModule) {
    return Promise.resolve().then(() => {
      if (!this._fastfs.dirExists(potentialDirPath)) {
        throw new UnableToResolveError(
          fromModule,
          toModule,
`Unable to find this module in its module map or any of the node_modules directories under ${potentialDirPath} and its parent directories

This might be related to https://github.com/facebook/react-native/issues/4968
To resolve try the following:
  1. Clear watchman watches: \`watchman watch-del-all\`.
  2. Delete the \`node_modules\` folder: \`rm -rf node_modules && npm install\`.
  3. Reset packager cache: \`rm -fr $TMPDIR/react-*\` or \`npm start -- --reset-cache\`.`,
        );
      }

      const packageJsonPath = path.join(potentialDirPath, 'package.json');
      if (this._fastfs.fileExists(packageJsonPath)) {
        return this._moduleCache.getPackage(packageJsonPath)
          .getMain().then(
            (main) => this._tryResolve(
              () => this._loadAsFile(main, fromModule, toModule),
              () => this._loadAsDir(main, fromModule, toModule)
            )
          );
      }

      return this._loadAsFile(
        path.join(potentialDirPath, 'index'),
        fromModule,
        toModule,
      );
    });
  }

  _resetResolutionCache() {
    this._immediateResolutionCache = Object.create(null);
  }

}


function resolutionHash(modulePath, depName) {
  return `${path.resolve(modulePath)}:${depName}`;
}


function UnableToResolveError(fromModule, toModule, message) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
  this.message = util.format(
    'Unable to resolve module %s from %s: %s',
    toModule,
    fromModule.path,
    message,
  );
  this.type = this.name = 'UnableToResolveError';
}

util.inherits(UnableToResolveError, Error);

function normalizePath(modulePath) {
  if (path.sep === '/') {
    modulePath = path.normalize(modulePath);
  } else if (path.posix) {
    modulePath = path.posix.normalize(modulePath);
  }

  return modulePath.replace(/\/$/, '');
}

module.exports = ResolutionRequest;
