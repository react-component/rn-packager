import React, { Component } from 'react';
import { AppRegistry, Text } from 'react-native';
import ImagePicker from 'react-native-image-picker';
import Widget from './widget';

class HelloWorldApp extends Component {
  render() {
    return (
      <Text>Hello world!</Text>
    );
  }
}

AppRegistry.registerComponent('HelloWorldApp', () => HelloWorldApp);
