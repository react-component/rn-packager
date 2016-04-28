# Packager

![react-native](https://img.shields.io/badge/react--native-%3D_0.25.0-rc-green.svg)

## Install

```
$ npm install rn-packager -g
```

## Dependences

```
"devDependencies": {
  "rn-core": "~0.4.0"
}
```
"rn-core@~0.4.0" 是 `0.25.0-rc` 的全量sdk工程，从官方的 "react-native" 依赖中抽取了前端框架源代码。

## rnpackager bundle
> 在项目工程根目录下执行打包命令，默认不打包框架代码及polyfills

```
$ rnpackager bundle --entry-file  entry/file/path.js --bundle-output out/file/path.jsbundle --platform ios
```

Options, 参数参考react-native命令，增加了参数：

*  --include-framework  Whether to bundle include module `react-native` and polyfills   [default: false]
*  --runBeforeMainModule  Modules required before main module                           [default: ["InitializeJavaScriptAppEngine"]]
    

## Bundle sdk

```
$ rnpackager bundle --entry-file node_modules/rn-core/react-native/Libraries/react-native/react-native.js --bundle-output ~/Desktop/react-native-debug.js --platform ios --include-framework
```

## Server

```
$ rnpackager start
```
url请求参数新增 `framework=true` `runBeforeMainModule=[]`

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