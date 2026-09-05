// Not `import 'expo/AppEntry'` — that file's own `../../App` import resolves
// relative to the hoisted node_modules/expo location in this npm-workspaces
// monorepo, not to this app, so it can't find our App.tsx.
import { Platform } from 'react-native';
import registerRootComponent from 'expo/build/launch/registerRootComponent';
import App from './App';

if (Platform.OS === 'web') {
  // expo/AppEntry normally injects this so RN's flex:1 has a real height to
  // fill; bypassing it above means we do it ourselves.
  const style = document.createElement('style');
  style.textContent = 'html, body, #root { height: 100%; }';
  document.head.appendChild(style);
}

registerRootComponent(App);
