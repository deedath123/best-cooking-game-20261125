// main.js — game loop, state machine, input, rush hour, serving.
import { render } from './kitchen.js';
import { newPlayer, newStations, nearestStation, updatePlayer, updateStations, interact } from './player.js';
import { newOrderState, updateOrders, findServableTicket, serveTicket } from './orders.js';
import { matchRecipe } from './recipes.js';
import { sfx, unlockAudio, toggleMute } from './audio.js';
import { applyShot } from './shots.js';

const SHIFT_LENGTH = 150;
const RUSH_EVERY = 45;
const RUSH_LENGTH = 20;

export const state = {
  screen: 'start',
  shiftLength: SHIFT_LENGTH,
  timeLeft: SHIFT_LENGTH,
  elapsed: 0,
  coins: 0,
  served: 0,
  perfectServes: 0,
  combo: 0,
  bestCombo: 0,
  best: 0,
  player: newPlayer(),
  stations: newStations(),
  orders: newOrderState(),
  rush: { active: false, nextIn: RUSH_EVERY, endsIn: 0 },
  floaters: [],
  nearStation: null,
  servePressed: false,
  frozen: false,
};

const keys = { left: false, right: false, up: false, down: false, interactHeld: false };

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resetShift() {
  state.timeLeft = SHIFT_LENGTH;
  state.elapsed = 0;
  state.coins = 0;
  state.served = 0;
  state.perfectServes = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.player = newPlayer();
  state.stations = newStations();
  state.orders = newOrderState();
  state.rush = { active: false, nextIn: RUSH_EVERY, endsIn: 0 };
  state.floaters = [];
  state.servePressed = false;
}

function startShift() {
  resetShift();
  state.screen = 'play';
  unlockAudio();
  sfx.ding();
}

function endShift() {
  state.screen = 'over';
  state.best = Math.max(state.best, state.coins);
  sfx.over();
}

function tryServe() {
  const recipe = matchRecipe(state.stations.plate);
  const ticket = findServableTicket(state.orders.tickets, recipe);
  if (!ticket) {
    state.floaters.push({ x: 1206, y: 310, text: 'No ticket matches!', color: '#ff8a7a', t: 0 });
    return;
  }
  const result = serveTicket(state, ticket, recipe);
  state.stations.plate = [];
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  if (result.perfect) {
    sfx.perfect();
    state.floaters.push({ x: 1206, y: 300, text: 'PERFECT! +' + result.coins, color: '#f7c948', t: 0 });
  } else {
    sfx.coin();
    state.floaters.push({ x: 1206, y: 300, text: '+' + result.coins + ' coins', color: '#7dc383', t: 0 });
  }
}

function update(dt) {
  if (state.screen !== 'play' || state.frozen) return;
  state.elapsed += dt;
  state.timeLeft -= dt;

  // Rush hour: every 45s, 20s of double pay and faster orders.
  const rush = state.rush;
  if (rush.active) {
    rush.endsIn -= dt;
    if (rush.endsIn <= 0) {
      rush.active = false;
      rush.nextIn = RUSH_EVERY;
    }
  } else {
    rush.nextIn -= dt;
    if (rush.nextIn <= 0) {
      rush.active = true;
      rush.endsIn = RUSH_LENGTH;
      sfx.rush();
      state.floaters.push({ x: 640, y: 180, text: 'RUSH HOUR — double coins!', color: '#ff8a7a', t: 0 });
    }
  }

  const expired = updateOrders(state, dt, state.elapsed, rush.active);
  if (expired.length > 0) {
    state.combo = 0;
    sfx.expire();
    state.floaters.push({ x: 240, y: 130, text: 'Order walked out!', color: '#ff8a7a', t: 0 });
  }

  updatePlayer(state, keys, dt);
  updateStations(state, dt);
  state.nearStation = nearestStation(state.player);

  if (state.servePressed) {
    state.servePressed = false;
    tryServe();
  }

  for (const f of state.floaters) f.t += dt;
  state.floaters = state.floaters.filter((f) => f.t < 1.4);

  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    endShift();
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render(ctx, state);
  requestAnimationFrame(loop);
}

function canvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) * (canvas.width / rect.width),
    y: (evt.clientY - rect.top) * (canvas.height / rect.height),
  };
}

window.addEventListener('keydown', (evt) => {
  const k = evt.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') keys.left = true;
  if (k === 'arrowright' || k === 'd') keys.right = true;
  if (k === 'arrowup' || k === 'w') keys.up = true;
  if (k === 'arrowdown' || k === 's') keys.down = true;
  if (k === 'e' || k === ' ') { keys.interactHeld = true; evt.preventDefault(); }
  if (evt.repeat) return;
  if (k === 'e' || k === ' ') {
    if (state.screen === 'play') interact(state);
  }
  if (k === 'enter') {
    if (state.screen === 'start' || state.screen === 'over') startShift();
  }
  if (k === 'p') {
    if (state.screen === 'play') state.screen = 'pause';
    else if (state.screen === 'pause') state.screen = 'play';
  }
  if (k === 'm') toggleMute();
});

window.addEventListener('keyup', (evt) => {
  const k = evt.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') keys.left = false;
  if (k === 'arrowright' || k === 'd') keys.right = false;
  if (k === 'arrowup' || k === 'w') keys.up = false;
  if (k === 'arrowdown' || k === 's') keys.down = false;
  if (k === 'e' || k === ' ') keys.interactHeld = false;
});

canvas.addEventListener('mousedown', (evt) => {
  unlockAudio();
  const pos = canvasPos(evt);
  if (state.screen === 'start' || state.screen === 'over') { startShift(); return; }
  if (state.screen !== 'play') return;
  // Click a station: walk to it if far, interact if close.
  const p = state.player;
  const d = Math.hypot(pos.x - p.x, pos.y - p.y);
  state.nearStation = nearestStation(p);
  if (d < 130 && state.nearStation) {
    interact(state);
  } else {
    p.target = { x: Math.max(40, Math.min(1240, pos.x)), y: Math.max(268, Math.min(690, pos.y)) };
  }
});

canvas.addEventListener('click', () => unlockAudio());

// Staged screenshot states (?shot=start|play|rush|end&seed=1) render the
// game's own code with fixed, deterministic scenes. See shots.js.
applyShot(state);
requestAnimationFrame(loop);
