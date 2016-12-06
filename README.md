# ReactNative Packager
---

Standalone ReactNative Packager without framework code.

![node.js](https://img.shields.io/badge/node.js-%3E=_4.0.0-green.svg?style=flat-square)
![react-native](https://img.shields.io/badge/react--native-%3D_0.39.0-green.svg)
![react](https://img.shields.io/badge/react-~_15.3.1-green.svg)

## Do What?

1. bundle-split, solution from https://github.com/facebook/react-native/pull/10804
2. use module name as before (ps: core.bundle and app.bundle are different bundle session, so module ids may conflict)

## Dependencies

```json
"devDependencies": {
  "rn-packager": "~0.10.0",
  "react-native": "0.39.0",
  "react": "~15.4.0-rc.4"
}
```
## Bundle

Now u can use `manifest.json` file to generate `core modules`.

1. Bundle ur core bundle and output `manifest.json`
2. Bundle ur app bundle with `manifest.json` that Step 1 generated.


### Bundle core

```shell
$ rnpackager bundle --entry-file node_modules/react-native/Libraries/react-native/react-native.js --bundle-output ~/Dowloads/core.ios.bundle --platform ios --manifest-output core.ios.manifest.json
```

### Bundle app

```shell
rnpackager bundle --entry-file foo.js --bundle-output ~/Dowloads/foo.ios.bundle --platform ios --manifest-file core.ios.manifest.json
```

## Server

```shell
$ rnpackager start
```

## Demo

```shell
$ cd tests
$ npm i
$ rnpackager start
```

visit:

* [http://localhost:8081/index.ios.bundle?platform=ios](http://localhost:8081/index.ios.bundle?platform=ios)
* [http://localhost:8081/index.android.bundle?platform=android](http://localhost:8081/index.android.bundle?platform=android)
