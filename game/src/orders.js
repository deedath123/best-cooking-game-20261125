// orders.js — the order board: ticket generation, patience, serving.
import { recipePool, recipeById } from './recipes.js';

let nextTicketId = 1;

export function makeTicket(elapsedSec, rush) {
  const pool = recipePool(elapsedSec);
  const recipe = pool[Math.floor(Math.random() * pool.length)];
  const patienceMax = rush ? 34 : 48;
  return {
    id: nextTicketId++,
    recipeId: recipe.id,
    patience: patienceMax,
    patienceMax,
    age: 0,
  };
}

export function newOrderState() {
  return { tickets: [], spawnIn: 1.5, maxTickets: 3 };
}

// Advance the board: drain patience, expire stale tickets, spawn new ones.
export function updateOrders(state, dt, elapsedSec, rush) {
  const board = state.orders;
  board.spawnIn -= dt;
  const cap = board.maxTickets + (rush ? 1 : 0);
  if (board.spawnIn <= 0 && board.tickets.length < cap) {
    board.tickets.push(makeTicket(elapsedSec, rush));
    const base = Math.max(7, 16 - elapsedSec / 12);
    board.spawnIn = rush ? base * 0.55 : base;
  }
  for (const t of board.tickets) {
    t.age += dt;
    t.patience -= dt * (rush ? 1.6 : 1);
  }
  const expired = board.tickets.filter((t) => t.patience <= 0);
  board.tickets = board.tickets.filter((t) => t.patience > 0);
  return expired;
}

export function ticketRecipe(ticket) {
  return recipeById(ticket.recipeId);
}

// Find the ticket this plate completes, preferring the most impatient one.
export function findServableTicket(tickets, recipe) {
  if (!recipe) return null;
  let best = null;
  for (const t of tickets) {
    if (t.recipeId === recipe.id && (!best || t.patience < best.patience)) best = t;
  }
  return best;
}

// Pay for a served ticket. Patience above half is a PERFECT serve.
// Rush hour doubles the pay. Returns { coins, perfect, multiplier }.
export function serveTicket(state, ticket, recipe) {
  const idx = state.orders.tickets.indexOf(ticket);
  if (idx >= 0) state.orders.tickets.splice(idx, 1);
  const perfect = ticket.patience > ticket.patienceMax * 0.5;
  state.combo = perfect ? state.combo + 1 : 1;
  const streakMult = 1 + Math.min(state.combo - 1, 8) * 0.25;
  const rushMult = state.rush.active ? 2 : 1;
  const coins = Math.round(recipe.pay * streakMult * rushMult);
  state.coins += coins;
  state.served += 1;
  if (perfect) state.perfectServes += 1;
  return { coins, perfect, multiplier: streakMult * rushMult };
}
