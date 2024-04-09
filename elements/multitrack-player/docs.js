import { PlayerComponent } from './src/component/Player';
import { ControlComponent } from './src/component/Controls';
import { StemComponent } from './src/component/Stem';

window.customElements.define('soundws-stem-player', PlayerComponent);
window.customElements.define('soundws-stem-player-controls', ControlComponent);
window.customElements.define('soundws-stem', StemComponent);
