// kitchen.js — everything you see: the room, stations, chef, tickets, HUD.
import { INGREDIENTS, displayName, matchRecipe, preparedId } from './recipes.js';
import { ticketRecipe } from './orders.js';
import { STATIONS, grillSlotState } from './player.js';

const W = 1280;
const H = 720;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align, weight) {
  ctx.fillStyle = color || '#2b2118';
  ctx.font = (weight || '700') + ' ' + size + 'px Trebuchet MS, Verdana, sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// Draw one ingredient as a chunky little food icon.
export function drawIngredient(ctx, id, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 2;
  if (id === 'bun') {
    ctx.fillStyle = '#e8a94e';
    ctx.beginPath();
    ctx.arc(0, u * 0.25, u, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d18f33';
    ctx.fillRect(-u, u * 0.2, u * 2, u * 0.35);
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath(); ctx.arc(-u * 0.4, -u * 0.35, u * 0.09, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(u * 0.3, -u * 0.55, u * 0.09, 0, 7); ctx.fill();
  } else if (id === 'patty' || id === 'pattyCooked') {
    ctx.fillStyle = id === 'pattyCooked' ? '#7a4a26' : '#c98a6b';
    rr(ctx, -u, -u * 0.45, u * 2, u * 0.9, u * 0.4);
    ctx.fill();
    if (id === 'pattyCooked') {
      ctx.strokeStyle = '#4a2c14';
      ctx.lineWidth = Math.max(2, u * 0.12);
      ctx.beginPath();
      ctx.moveTo(-u * 0.5, -u * 0.2); ctx.lineTo(u * 0.5, -u * 0.2);
      ctx.moveTo(-u * 0.5, u * 0.2); ctx.lineTo(u * 0.5, u * 0.2);
      ctx.stroke();
    }
  } else if (id === 'lettuce' || id === 'lettuceChopped') {
    ctx.fillStyle = '#7dc383';
    if (id === 'lettuce') {
      ctx.beginPath();
      ctx.moveTo(-u, 0);
      ctx.quadraticCurveTo(-u * 0.5, -u, 0, 0);
      ctx.quadraticCurveTo(u * 0.5, -u, u, 0);
      ctx.quadraticCurveTo(u * 0.5, u * 0.7, 0, u * 0.5);
      ctx.quadraticCurveTo(-u * 0.5, u * 0.7, -u, 0);
      ctx.fill();
      ctx.strokeStyle = '#4a8f52';
      ctx.lineWidth = Math.max(2, u * 0.1);
      ctx.beginPath(); ctx.moveTo(0, -u * 0.5); ctx.lineTo(0, u * 0.4); ctx.stroke();
    } else {
      for (let i = -1; i <= 1; i++) {
        ctx.fillRect(i * u * 0.6 - u * 0.25, -u * 0.5, u * 0.5, u);
      }
    }
  } else if (id === 'tomato' || id === 'tomatoChopped') {
    ctx.fillStyle = '#e4574a';
    if (id === 'tomato') {
      ctx.beginPath(); ctx.arc(0, 0, u * 0.85, 0, 7); ctx.fill();
      ctx.fillStyle = '#4a8f52';
      ctx.beginPath(); ctx.arc(0, -u * 0.7, u * 0.3, 0, 7); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(-u * 0.35, 0, u * 0.55, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(u * 0.4, 0, u * 0.55, 0, 7); ctx.fill();
      ctx.fillStyle = '#f2a49d';
      ctx.beginPath(); ctx.arc(-u * 0.35, 0, u * 0.25, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(u * 0.4, 0, u * 0.25, 0, 7); ctx.fill();
    }
  } else if (id === 'cheese') {
    ctx.save();
    ctx.rotate(-0.12);
    ctx.fillStyle = '#f7c948';
    ctx.fillRect(-u * 0.9, -u * 0.55, u * 1.8, u * 1.1);
    ctx.fillStyle = '#d9a41f';
    ctx.beginPath(); ctx.arc(-u * 0.4, -u * 0.1, u * 0.14, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(u * 0.35, u * 0.2, u * 0.14, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(u * 0.1, -u * 0.35, u * 0.1, 0, 7); ctx.fill();
    ctx.restore();
  } else if (id === 'sauce') {
    ctx.fillStyle = '#f2e3c6';
    ctx.beginPath();
    ctx.moveTo(-u, u * 0.3);
    ctx.quadraticCurveTo(-u * 0.5, -u * 0.8, 0, -u * 0.2);
    ctx.quadraticCurveTo(u * 0.5, -u * 0.9, u, u * 0.3);
    ctx.quadraticCurveTo(0, u * 0.8, -u, u * 0.3);
    ctx.fill();
    ctx.fillStyle = '#e4574a';
    ctx.beginPath(); ctx.arc(0, -u * 0.1, u * 0.18, 0, 7); ctx.fill();
  } else if (id === 'burnt') {
    ctx.fillStyle = '#2b2b2b';
    rr(ctx, -u, -u * 0.45, u * 2, u * 0.9, u * 0.4);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-u * 0.5, -u * 0.2); ctx.lineTo(u * 0.4, u * 0.25); ctx.stroke();
  }
  ctx.restore();
}

function drawRoom(ctx) {
  // Wall and floor.
  ctx.fillStyle = '#f6e3c2';
  ctx.fillRect(0, 0, W, 132);
  ctx.fillStyle = '#e8cfa5';
  for (let x = 0; x < W; x += 96) ctx.fillRect(x, 122, 96, 10);
  ctx.fillStyle = '#c98d5a';
  ctx.fillRect(0, 0, W, 8);
  // Floor tiles.
  ctx.fillStyle = '#d9b98c';
  ctx.fillRect(0, 132, W, H - 132);
  ctx.strokeStyle = 'rgba(120,80,40,0.25)';
  ctx.lineWidth = 2;
  for (let y = 132; y < H; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let x = 0; x < W; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 132); ctx.lineTo(x, H); ctx.stroke();
  }
}

function drawCounter(ctx) {
  ctx.fillStyle = '#8a5a3b';
  rr(ctx, 24, 132, 1100, 106, 12);
  ctx.fill();
  ctx.fillStyle = '#a9744f';
  rr(ctx, 24, 132, 1100, 18, 9);
  ctx.fill();
}

function drawCrates(ctx, state) {
  for (const c of STATIONS.crates) {
    const ing = INGREDIENTS[c.id];
    const near = state.nearStation === c;
    ctx.fillStyle = near ? '#ffe9b0' : '#f3d9a4';
    rr(ctx, c.x, c.y, c.w, c.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#8a5a3b';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    drawIngredient(ctx, c.id, c.x + c.w / 2, c.y + 30, 40);
    text(ctx, ing.name, c.x + c.w / 2, c.y + c.h - 10, 12, '#5a4632', 'center');
    if (near) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      rr(ctx, c.x - 3, c.y - 3, c.w + 6, c.h + 6, 10);
      ctx.stroke();
    }
  }
}

function drawBoard(ctx, state) {
  const b = STATIONS.board;
  const near = state.nearStation === b;
  ctx.fillStyle = near ? '#ffe9b0' : '#e8c795';
  rr(ctx, b.x, b.y, b.w, b.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#8a5a3b';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  text(ctx, 'CHOP', b.x + b.w / 2, b.y + 12, 11, '#8a5a3b', 'center');
  const item = state.stations.board.item;
  if (item) {
    drawIngredient(ctx, item, b.x + b.w / 2, b.y + 42, 42);
    if (state.stations.board.progress > 0) {
      ctx.fillStyle = '#00000033';
      ctx.fillRect(b.x + 8, b.y + b.h - 12, b.w - 16, 7);
      ctx.fillStyle = '#7dc383';
      ctx.fillRect(b.x + 8, b.y + b.h - 12, (b.w - 16) * state.stations.board.progress, 7);
    }
    const ing = INGREDIENTS[item];
    if (ing && ing.chop && item === preparedId(item)) text(ctx, 'ready ✓', b.x + b.w / 2, b.y - 10, 11, '#2f7a3a', 'center');
    else if (ing && ing.chop) text(ctx, 'hold E to chop', b.x + b.w / 2, b.y - 10, 11, '#fff', 'center');
  } else {
    text(ctx, 'board', b.x + b.w / 2, b.y + 42, 12, '#a8815a', 'center', '600');
  }
  if (near) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    rr(ctx, b.x - 3, b.y - 3, b.w + 6, b.h + 6, 10);
    ctx.stroke();
  }
}

function drawGrill(ctx, state) {
  const g = STATIONS.grill;
  const near = state.nearStation === g;
  ctx.fillStyle = '#3a3a3a';
  rr(ctx, g.x, g.y, g.w, g.h, 10);
  ctx.fill();
  ctx.strokeStyle = near ? '#fff' : '#222';
  ctx.lineWidth = near ? 3 : 2;
  rr(ctx, g.x, g.y, g.w, g.h, 10);
  ctx.stroke();
  text(ctx, 'GRILL', g.x + 12, g.y + 13, 11, '#f7c948', 'left');
  state.stations.grill.forEach((slot, i) => {
    const cx = g.x + 56 + i * 100;
    const cy = g.y + 50;
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 7); ctx.fill();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = -2; k <= 2; k++) {
      ctx.moveTo(cx - 24, cy + k * 10);
      ctx.lineTo(cx + 24, cy + k * 10);
    }
    ctx.stroke();
    if (slot.item) {
      const st = grillSlotState(slot);
      drawIngredient(ctx, 'pattyCooked', cx, cy, 44);
      if (st === 'cooking') {
        // Progress ring around the slot.
        ctx.strokeStyle = '#f7c948';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, 35, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (slot.t / 6));
        ctx.stroke();
      } else if (st === 'burnt') {
        drawIngredient(ctx, 'burnt', cx, cy, 44);
        text(ctx, 'BURNT', cx, cy + 40, 11, '#ff6b5e', 'center');
      } else {
        text(ctx, 'READY', cx, cy + 40, 11, '#7dc383', 'center');
      }
    }
  });
}

function drawPlate(ctx, state) {
  const pl = STATIONS.plate;
  const near = state.nearStation === pl;
  const recipe = matchRecipe(state.stations.plate);
  ctx.fillStyle = '#8a5a3b';
  rr(ctx, pl.x - 6, pl.y - 6, pl.w + 12, pl.h + 12, 10);
  ctx.fill();
  ctx.fillStyle = '#fff8ea';
  ctx.beginPath();
  ctx.ellipse(pl.x + pl.w / 2, pl.y + pl.h / 2 + 6, 52, 30, 0, 0, 7);
  ctx.fill();
  ctx.strokeStyle = recipe ? '#7dc383' : '#cbb98f';
  ctx.lineWidth = recipe ? 4 : 2;
  ctx.stroke();
  const items = state.stations.plate;
  items.forEach((id, i) => {
    drawIngredient(ctx, id, pl.x + pl.w / 2, pl.y + 46 - i * 8, 40);
  });
  text(ctx, 'PLATE', pl.x + pl.w / 2, pl.y + 10, 11, '#fff', 'center');
  if (recipe) {
    text(ctx, recipe.name + ' ✓ ready', pl.x + pl.w / 2, pl.y + pl.h + 22, 12, '#2f7a3a', 'center');
  } else if (items.length === 0) {
    text(ctx, 'assemble here', pl.x + pl.w / 2, pl.y + pl.h + 22, 11, '#8a7a5f', 'center', '600');
  }
  if (near) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    rr(ctx, pl.x - 9, pl.y - 9, pl.w + 18, pl.h + 18, 12);
    ctx.stroke();
  }
}

function drawServe(ctx, state) {
  const s = STATIONS.serve;
  const near = state.nearStation === s;
  const recipe = matchRecipe(state.stations.plate);
  const ready = !!recipe;
  ctx.fillStyle = ready ? '#2f7a3a' : '#5a4632';
  rr(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  ctx.fillStyle = '#fff8ea';
  rr(ctx, s.x + 10, s.y + 10, s.w - 20, 62, 8);
  ctx.fill();
  text(ctx, 'SERVE', s.x + s.w / 2, s.y + 30, 18, '#a83228', 'center');
  text(ctx, ready ? recipe.name : 'window', s.x + s.w / 2, s.y + 56, 12, '#5a4632', 'center');
  // Service bell.
  ctx.fillStyle = '#f7c948';
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + 108, 20, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(s.x + s.w / 2 - 24, s.y + 106, 48, 5);
  ctx.fillStyle = '#d9a41f';
  ctx.beginPath(); ctx.arc(s.x + s.w / 2 + 22, s.y + 114, 4, 0, 7); ctx.fill();
  if (ready) {
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 180);
    ctx.strokeStyle = 'rgba(125,195,131,' + (0.5 + pulse * 0.5) + ')';
    ctx.lineWidth = 5;
    rr(ctx, s.x - 4, s.y - 4, s.w + 8, s.h + 8, 14);
    ctx.stroke();
    text(ctx, 'press E!', s.x + s.w / 2, s.y + s.h - 12, 13, '#b8f0c0', 'center');
  } else if (near) {
    text(ctx, 'finish a plate first', s.x + s.w / 2, s.y + s.h - 12, 11, '#d9c9a8', 'center');
  }
  if (near && !ready) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    rr(ctx, s.x - 3, s.y - 3, s.w + 6, s.h + 6, 14);
    ctx.stroke();
  }
}

function drawTrash(ctx, state) {
  const t = STATIONS.trash;
  const near = state.nearStation === t;
  ctx.fillStyle = near ? '#8fa3b8' : '#6b7c8c';
  rr(ctx, t.x, t.y, t.w, t.h, 8);
  ctx.fill();
  ctx.fillStyle = '#54636f';
  ctx.fillRect(t.x + 8, t.y - 4, t.w - 16, 10);
  text(ctx, 'TRASH', t.x + t.w / 2, t.y + t.h / 2 + 12, 12, '#fff', 'center');
  if (near) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    rr(ctx, t.x - 3, t.y - 3, t.w + 6, t.h + 6, 10);
    ctx.stroke();
  }
}

function drawChef(ctx, state) {
  const p = state.player;
  const bob = p.moving ? Math.sin(Date.now() / 90) * 3 : 0;
  ctx.save();
  ctx.translate(p.x, p.y + bob * 0.3);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 26, 24, 8, 0, 0, 7); ctx.fill();
  // Body + apron.
  ctx.fillStyle = '#fff8ea';
  rr(ctx, -18, -6, 36, 34, 12);
  ctx.fill();
  ctx.fillStyle = '#e4574a';
  rr(ctx, -13, 6, 26, 20, 8);
  ctx.fill();
  // Head.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(0, -20, 15, 0, 7); ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-9, -32, 8, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -36, 9, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(9, -32, 8, 0, 7); ctx.fill();
  ctx.fillRect(-13, -34, 26, 7);
  // Eyes.
  ctx.fillStyle = '#2b2118';
  ctx.beginPath(); ctx.arc(-5 + p.dir * 2, -20, 2, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(5 + p.dir * 2, -20, 2, 0, 7); ctx.fill();
  // Carried item above the hat.
  if (p.carrying) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(0, -58, 22, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, p.carrying, 0, -58, 34);
    text(ctx, displayName(p.carrying), 0, -84, 12, '#fff', 'center');
  }
  ctx.restore();
}

function drawTickets(ctx, state) {
  const tickets = state.orders.tickets;
  const startX = 24;
  tickets.forEach((t, i) => {
    const recipe = ticketRecipe(t);
    const x = startX + i * 216;
    const y = 10;
    const frac = Math.max(0, t.patience / t.patienceMax);
    const urgent = frac < 0.35;
    ctx.fillStyle = '#fff8ea';
    rr(ctx, x, y, 204, 104, 10);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#e4574a' : '#c9a86a';
    ctx.lineWidth = urgent ? 3.5 : 2;
    ctx.stroke();
    text(ctx, '#' + t.id + '  ' + recipe.name, x + 12, y + 16, 14, '#2b2118', 'left');
    text(ctx, recipe.pay + ' coins', x + 192, y + 16, 12, '#a83228', 'right');
    recipe.items.forEach((id, k) => {
      drawIngredient(ctx, id, x + 26 + k * 44, y + 46, 34);
    });
    // Patience bar.
    ctx.fillStyle = '#e8dcc4';
    rr(ctx, x + 12, y + 78, 180, 12, 6);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#7dc383' : frac > 0.25 ? '#f7c948' : '#e4574a';
    if (frac > 0) {
      rr(ctx, x + 12, y + 78, 180 * frac, 12, 6);
      ctx.fill();
    }
  });
  if (tickets.length === 0) {
    text(ctx, 'No orders yet — grab ingredients!', 40, 60, 16, '#8a7a5f', 'left', '600');
  }
}

function drawHud(ctx, state) {
  // Top-right cluster: timer, coins, combo.
  const mins = Math.floor(Math.max(0, state.timeLeft) / 60);
  const secs = Math.floor(Math.max(0, state.timeLeft) % 60);
  const timeStr = mins + ':' + String(secs).padStart(2, '0');
  const urgent = state.timeLeft < 30;
  ctx.fillStyle = 'rgba(43,33,24,0.85)';
  rr(ctx, 880, 10, 376, 104, 12);
  ctx.fill();
  text(ctx, 'SHIFT', 900, 30, 12, '#d9c9a8', 'left');
  text(ctx, timeStr, 900, 62, 34, urgent ? '#ff8a7a' : '#fff8ea', 'left');
  // Timer bar.
  const tfrac = Math.max(0, state.timeLeft / state.shiftLength);
  ctx.fillStyle = '#00000055';
  rr(ctx, 900, 88, 180, 10, 5);
  ctx.fill();
  ctx.fillStyle = urgent ? '#e4574a' : '#7dc383';
  rr(ctx, 900, 88, 180 * tfrac, 10, 5);
  ctx.fill();
  // Coins.
  ctx.fillStyle = '#f7c948';
  ctx.beginPath(); ctx.arc(1110, 34, 13, 0, 7); ctx.fill();
  ctx.fillStyle = '#a83228';
  ctx.font = '700 14px Trebuchet MS, Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 1110, 34);
  text(ctx, String(state.coins), 1130, 34, 24, '#fff8ea', 'left');
  text(ctx, 'coins', 1130, 56, 11, '#d9c9a8', 'left', '600');
  // Combo.
  if (state.combo > 1) {
    text(ctx, 'COMBO x' + state.combo, 1130, 84, 16, '#f7c948', 'left');
  } else {
    text(ctx, 'served: ' + state.served, 1130, 84, 13, '#d9c9a8', 'left', '600');
  }
  // Rush banner — sits on the open floor below the counter so it never
  // covers a station.
  if (state.rush.active) {
    const flash = 0.55 + 0.45 * Math.sin(Date.now() / 120);
    ctx.fillStyle = 'rgba(232,87,74,' + (0.75 + flash * 0.25) + ')';
    rr(ctx, 380, 248, 520, 40, 10);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'RUSH HOUR!  Double coins — ' + Math.ceil(state.rush.endsIn) + 's', 640, 268, 20, '#fff', 'center');
  } else if (state.rush.nextIn < 10 && state.screen === 'play') {
    text(ctx, 'Rush hour in ' + Math.ceil(state.rush.nextIn) + 's…', 640, 268, 15, '#fff', 'center');
  }
  // Floaters.
  for (const f of state.floaters) {
    const a = Math.max(0, 1 - f.t / 1.4);
    ctx.globalAlpha = a;
    text(ctx, f.text, f.x, f.y - f.t * 34, 18, f.color, 'center');
    ctx.globalAlpha = 1;
  }
  // Hint line on a dark pill so it reads on the floor.
  ctx.fillStyle = 'rgba(43,33,24,0.75)';
  rr(ctx, 300, 690, 680, 24, 12);
  ctx.fill();
  text(ctx, 'WASD / arrows move · E or Space interact · click a station to walk there · P pause · M mute', 640, 702, 12, '#fff8ea', 'center', '600');
}

function drawOverlay(ctx, state) {
  if (state.screen === 'start') {
    ctx.fillStyle = 'rgba(43,33,24,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff8ea';
    rr(ctx, 290, 90, 700, 520, 18);
    ctx.fill();
    ctx.strokeStyle = '#e8a94e';
    ctx.lineWidth = 4;
    ctx.stroke();
    text(ctx, 'SIZZLE & SERVE', 640, 150, 52, '#a83228', 'center');
    text(ctx, 'a tiny burger joint, one very busy chef — you', 640, 196, 17, '#5a4632', 'center', '600');
    drawIngredient(ctx, 'bun', 480, 250, 64);
    drawIngredient(ctx, 'pattyCooked', 560, 250, 64);
    drawIngredient(ctx, 'lettuceChopped', 640, 250, 64);
    drawIngredient(ctx, 'tomatoChopped', 720, 250, 64);
    drawIngredient(ctx, 'cheese', 800, 250, 64);
    const lines = [
      '1. Grab ingredients from the crates (bun, patty, lettuce, tomato, cheese, sauce).',
      '2. Grill patties — take them off in time or they burn!',
      '3. Chop lettuce and tomato on the board (hold E).',
      '4. Stack the dish on the plate, then serve it at the window.',
      '5. Serve fast for PERFECT bonuses and combos. RUSH HOUR pays double!',
    ];
    lines.forEach((l, i) => text(ctx, l, 330, 300 + i * 30, 16, '#2b2118', 'left', '600'));
    text(ctx, 'WASD / arrows to move · E or Space to interact · mouse click also works', 640, 470, 15, '#5a4632', 'center');
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 300);
    ctx.globalAlpha = pulse;
    text(ctx, 'Press ENTER or click to start the shift', 640, 530, 22, '#a83228', 'center');
    ctx.globalAlpha = 1;
    text(ctx, '150-second shift · best score this session: ' + state.best, 640, 566, 14, '#8a7a5f', 'center', '600');
  } else if (state.screen === 'pause') {
    ctx.fillStyle = 'rgba(43,33,24,0.6)';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'PAUSED', 640, 330, 56, '#fff8ea', 'center');
    text(ctx, 'Press P to keep cooking', 640, 390, 20, '#fff8ea', 'center', '600');
  } else if (state.screen === 'over') {
    ctx.fillStyle = 'rgba(43,33,24,0.78)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff8ea';
    rr(ctx, 340, 130, 600, 440, 18);
    ctx.fill();
    ctx.strokeStyle = '#e8a94e';
    ctx.lineWidth = 4;
    ctx.stroke();
    text(ctx, 'SHIFT OVER!', 640, 190, 48, '#a83228', 'center');
    text(ctx, 'The kitchen closes its doors…', 640, 232, 16, '#5a4632', 'center', '600');
    text(ctx, 'SCORE', 640, 290, 15, '#8a7a5f', 'center');
    text(ctx, String(state.coins) + ' coins', 640, 330, 44, '#2b2118', 'center');
    text(ctx, 'Dishes served: ' + state.served + '   ·   Perfect serves: ' + state.perfectServes, 640, 386, 17, '#2b2118', 'center', '600');
    text(ctx, 'Best combo: x' + state.bestCombo + '   ·   Best score: ' + state.best, 640, 420, 17, '#2b2118', 'center', '600');
    const verdict = state.coins >= 200 ? 'Head-chef material!' : state.coins >= 120 ? 'A solid shift!' : state.coins >= 60 ? 'The lunch rush survived you.' : 'The grill sends its regards.';
    text(ctx, verdict, 640, 462, 18, '#a83228', 'center');
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 300);
    ctx.globalAlpha = pulse;
    text(ctx, 'Press ENTER to cook again', 640, 520, 20, '#a83228', 'center');
    ctx.globalAlpha = 1;
  }
}

export function render(ctx, state) {
  drawRoom(ctx);
  drawCounter(ctx);
  drawCrates(ctx, state);
  drawBoard(ctx, state);
  drawGrill(ctx, state);
  drawPlate(ctx, state);
  drawServe(ctx, state);
  drawTrash(ctx, state);
  drawChef(ctx, state);
  drawTickets(ctx, state);
  drawHud(ctx, state);
  drawOverlay(ctx, state);
}
