module.exports = function(babel) {
  babel.plugins.push([require.resolve('babel-plugin-antd'),{
    libraryName:'./antm'
  }]);
  return babel;
}
