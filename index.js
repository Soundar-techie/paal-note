import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// Ensures that whether loading the app in Expo Go or in a native/web build,
// the environment is set up appropriately
registerRootComponent(App);
