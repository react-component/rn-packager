/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

// @Denis
require('../../packager/babelRegisterOnly')([
  /local-cli/
]);

// @Denis
const Config = require('../util/Config');
const defaultConfig = require('../default.config');

const buildBundle = require('./buildBundle');
const bundleCommandLineArgs = require('./bundleCommandLineArgs');
const parseCommandLine = require('../util/parseCommandLine');
const outputBundle = require('./output/bundle');
const outputPrepack = require('./output/prepack');

/**
 * Builds the bundle starting to look for dependencies at the given entry path.
 */
function bundleWithOutput(argv, config, output) {
  const args = parseCommandLine(bundleCommandLineArgs, argv);
  if (!output) {
    output = args.prepack ? outputPrepack : outputBundle;
  }
  return buildBundle(args, config, output);

}

function bundle(argv, config) {
  // @Denis 支持构建脚本传入object参数
  if (!argv.length) {
    var args = ['bundle'];
    for(var key in argv) {
      args.push(key);
      args.push(argv[key].toString());
    }
    argv = args;
    config = Config.get(__dirname, defaultConfig);
  }  
  return bundleWithOutput(argv, config);
}

module.exports = bundle;
module.exports.withOutput = bundleWithOutput;
