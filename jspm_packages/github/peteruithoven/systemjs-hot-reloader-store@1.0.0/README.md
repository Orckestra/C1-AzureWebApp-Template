# SystemJS hot reloader store
Extremely simple utility for storing data across hot reloads.  
Compatible with: [systemjs-hot-reloader](https://github.com/capaj/systemjs-hot-reloader)

## Usage
``` javascript
import getHotReloadStore from './utils/getHotReloadStore.js';
const hotStore = getHotReloadStore('project:index'); // pick unique name

// retrieve stored or create new state
const state = hotStore.state || {
	counter: 0
};

// change state
state.counter += 1;

// store state
hotStore.state = state;
```
