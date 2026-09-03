// Not `import 'expo/AppEntry'` — that file's own `../../App` import resolves
// relative to the hoisted node_modules/expo location in this npm-workspaces
// monorepo, not to this app, so it can't find our App.tsx.
import registerRootComponent from 'expo/build/launch/registerRootComponent';
import App from './App';

registerRootComponent(App);
