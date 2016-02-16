# Packager

![react-native](https://img.shields.io/badge/react--native-%3D_0.19.0-green.svg)

## Install

```
$ npm install rn-packager -g
```

## Dependences

```
"devDependencies": {
  "rn-core": "~0.2.0"
}
```
"rn-core" 是 `0.19.0` 的全量sdk工程，你可以 获取 [rn-core](https://github.com/react-component/rn-core) `tag v0.2.1` 的代码来精简你的JS核心SDK文件，修改 devDependencies 依赖精简后的工程。

## rnpackager bundle
> 在项目工程根目录下执行打包命令，默认不打包框架代码及polyfills

```
$ rnpackager bundle --entry-file  entry/file/path.js --bundle-output out/file/path.jsbundle --platform ios
```

Options, 参数参考react-native命令，增加了`--include-framework`:

*  --include-framework  Whether to bundle include module `react-native` and polyfills                          [default: false]
    

## Bundle sdk

```
$ rnpackager bundle --entry-file node_modules/rn-core/react-native/Libraries/react-native/react-native.js --bundle-output ~/Desktop/react-native-debug.js --platform ios --include-framework
```

## Server

```
$ rnpackager start
```
url请求参数新增`framework=true` 

## Programmatic API
```
var RNPackager = require('rn-packager');

gulp.task('task', function(){
  return RNPackager.bundle({
    "--entry-file": "tests/index.ios.js",
    "--bundle-output": "tests/index.ios.bundle",
    "--platform": "ios"
  });
});
```

## Project Sample

```
$ cd tests
$ npm i
$ rnpackager start
```
Visit:

* [http://localhost:8081/index.ios.bundle?platform=ios](http://localhost:8081/index.ios.bundle?platform=ios)
* [http://localhost:8081/index.android.bundle?platform=android](http://localhost:8081/index.android.bundle?platform=android)