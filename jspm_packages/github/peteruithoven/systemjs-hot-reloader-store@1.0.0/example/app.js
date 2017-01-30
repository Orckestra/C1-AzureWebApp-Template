import 'systemjs-hot-reloader/default-listener.js';
import getHotReloadStore from '../index.js';
const hotStore = getHotReloadStore('example:index'); // unique name

// retrieve stored or create new state
const state = hotStore.state || {
	counter: 0
};

// change state
state.counter += 1;
console.log('state.counter: ', state.counter);
document.body.innerHTML = state.counter;

// store state
hotStore.state = state;
