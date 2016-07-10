module.exports = function(babel) {
  babel.plugins.push([require('babel-plugin-antd'),{
    libraryName:'./antm'
  }]);
  return babel;
}
