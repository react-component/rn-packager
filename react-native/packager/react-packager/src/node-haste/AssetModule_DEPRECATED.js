'use strict';

const Module = require('./Module');
const getAssetDataFromName = require('./lib/getAssetDataFromName');

class AssetModule_DEPRECATED extends Module {
  constructor(args, platforms) {
    super(args);
    const {resolution, name} = getAssetDataFromName(this.path, platforms);
    this.resolution = resolution;
    this.name = name;
    // @Denis
    this.moduleName = 'image!' + name;
    this.platforms = platforms;
  }

  isHaste() {
    return Promise.resolve(false);
  }

  getName() {
    // @Denis
    // return Promise.resolve(`image!${this.name}`);
    return Promise.resolve(this.moduleName);
  }

  getDependencies() {
    return Promise.resolve([]);
  }

  hash() {
    return `AssetModule_DEPRECATED : ${this.path}`;
  }

  isJSON() {
    return false;
  }

  isAsset_DEPRECATED() {
    return true;
  }

  resolution() {
    return getAssetDataFromName(this.path, this.platforms).resolution;
  }

}

module.exports = AssetModule_DEPRECATED;
