/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// @Denis
'use strict';

require('../../packager/babelRegisterOnly')([
 /local-cli/
]);
const defaultConfig = require('../default.config');

const buildBundle = require('./buildBundle');
const outputBundle = require('./output/bundle');
const outputPrepack = require('./output/prepack');
const bundleCommandLineArgs = require('./bundleCommandLineArgs');

/**
 * Builds the bundle starting to look for dependencies at the given entry path.
 */
function bundleWithOutput(argv, config, args, output, packagerInstance) {
  if (!output) {
    output = args.prepack ? outputPrepack : outputBundle;
  }
  return buildBundle(args, config, output, packagerInstance);
}

function bundle(argv, config, args, packagerInstance) {
  // @Denis 支持构建脚本传入object参数
  if (isNaN(argv.length)) {
    config = config || defaultConfig;
    var args = argv;
    args.bundleEncoding = args.bundleEncoding || 'utf8';
    args.transformer = args.transformer || config.getTransformModulePath();
  }
  // console.log('argv:', argv);
  // console.log('config:', config);
  // console.log('args:', args);
  return bundleWithOutput(argv, config, args, undefined, packagerInstance);
}

module.exports = {
  name: 'bundle',
  description: 'builds the javascript bundle for offline use',
  func: bundle,
  options: bundleCommandLineArgs,

  // not used by the CLI itself
  withOutput: bundleWithOutput,
};
