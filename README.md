# ReactNative Packager
---

Standalone ReactNative Packager without framework code.

![node.js](https://img.shields.io/badge/node.js-%3E=_4.0.0-green.svg?style=flat-square)
![react-native](https://img.shields.io/badge/react--native-%3D_0.34.1-green.svg)
![react](https://img.shields.io/badge/react-~_15.3.1-green.svg)

## Dependencies

```
"devDependencies": {
  "rn-packager": "~0.9.0",
  "react-native": "0.34.1",
  "react": "~15.3.1"
}
```
### Important: 
add `rn-blackliast.js` file at your project root dir for filter modules those your don't want package!

see the standard file at `lib/rn-blacklist.js`. your can add your common modules, support RegExp.

## Bundle

bundle without framework code and polyfill

```
$ node_modules/rn-packager/bin/rnpackager bundle --entry-file  entry/file/path.js --bundle-output out/file/path.jsbundle --platform ios
```

added parameters:

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

added query parameters: `framework=true` `runBeforeMainModule=[]`

## Programmatic API
```
var RNPackager = require('rn-packager');

gulp.task('task', function(){
  return RNPackager.bundle.func({
    "--entry-file": "tests/index.ios.js",
    "--bundle-output": "tests/index.ios.bundle",
    "--platform": "ios"
  });
});
```

## Demo

```
$ cd tests
$ npm i
$ rnpackager start
```

visit:

* [http://localhost:8081/index.ios.bundle?platform=ios](http://localhost:8081/index.ios.bundle?platform=ios)
* [http://localhost:8081/index.android.bundle?platform=android](http://localhost:8081/index.android.bundle?platform=android)
