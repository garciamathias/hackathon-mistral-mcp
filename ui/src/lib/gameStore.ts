// src/lib/gameStore.ts
import { v4 as uuidv4 } from "uuid";

export type TroopType = "GIANT" | "BABY_DRAGON" | "MINI_PEKKA" | "VALKYRIE";
export type Team = "red" | "blue";

const BOARD_ROWS = 34;
const BOARD_COLS = 18;

function isValidTroopType(x: unknown): x is TroopType {
  return x === "GIANT" || x === "BABY_DRAGON" || x === "MINI_PEKKA" || x === "VALKYRIE";
}
function isValidTeam(x: unknown): x is Team {
  return x === "red" || x === "blue";
}
function isValidPosition(p: any): p is { row: number; col: number } {
  return p && Number.isFinite(p.row) && Number.isFinite(p.col);
}
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function sanitizePosition(pos: { row: number; col: number }) {
  // Discrétise sur la grille et clamp dans les bornes
  const row = clamp(Math.floor(pos.row), 0, BOARD_ROWS - 1);
  const col = clamp(Math.floor(pos.col), 0, BOARD_COLS - 1);
  return { row, col };
}

export interface Troop {
  id: string;
  type: TroopType;
  team: Team;
  position: { row: number; col: number };
  health: number;
  max_health: number;
  spawned_at: string;
  speed: number;              // cellules par seconde
  dir: { dr: number; dc: number }; // direction unitaire
}

export interface Tower {
  id: string;
  team: Team;
  type: "king" | "princess";
  health: number;
  max_health: number;
  position: { row: number; col: number };
}

export interface GameState {
  game_id: string;
  troops: Troop[];
  towers: Record<string, Tower>;
  elixir: { red: number; blue: number };
  max_elixir: number;
  elixir_rate: number;
  available_cards: TroopType[];
  game_time: number;
  start_time: string;
  is_game_over: boolean;
  winner: string | null;
  tactical_analysis: string;
  last_update_ms: number; // timestamp ms du dernier tick serveur
}

const games = new Map<string, GameState>();

function defaultTowers(): Record<string, Tower> {
  return {
    king_red:   { id: "king_red",   team: "red",  type: "king",     health: 100, max_health: 100, position: { row: 2,  col: 8 } },
    princess_red_left:  { id: "princess_red_left",  team: "red",  type: "princess", health: 100, max_health: 100, position: { row: 6,  col: 3 } },
    princess_red_right: { id: "princess_red_right", team: "red",  type: "princess", health: 100, max_health: 100, position: { row: 6,  col: 14 } },
    king_blue:  { id: "king_blue",  team: "blue", type: "king",     health: 100, max_health: 100, position: { row: 31, col: 8 } },
    princess_blue_left: { id: "princess_blue_left", team: "blue", type: "princess", health: 100, max_health: 100, position: { row: 27, col: 3 } },
    princess_blue_right:{ id: "princess_blue_right",team: "blue", type: "princess", health: 100, max_health: 100, position: { row: 27, col: 14 } },
  };
}

export function createGame(): GameState {
  const now = Date.now();
  const id = uuidv4();
  const state: GameState = {
    game_id: id,
    troops: [],
    towers: defaultTowers(),
    elixir: { red: 5, blue: 5 },
    max_elixir: 10,
    elixir_rate: 1,
    available_cards: ["GIANT", "BABY_DRAGON", "MINI_PEKKA", "VALKYRIE"],
    game_time: 0,
    start_time: new Date(now).toISOString(),
    is_game_over: false,
    winner: null,
    tactical_analysis: "Equal troop count on battlefield. Early game: Focus on elixir trades and chip damage",
    last_update_ms: now,
  };
  games.set(id, state);
  return state;
}

export function getGame(id: string): GameState | null {
  return games.get(id) || null;
}

// Invariant durci: aucune troupe n'est insérée sans position valide.
export function spawnTroop(
  id: string,
  troop_type: unknown,
  team: unknown,
  position: unknown
): GameState | null {
  const game = games.get(id);
  if (!game) return null;

  if (!isValidTroopType(troop_type)) throw new Error("Invalid troop_type");
  if (!isValidTeam(team)) throw new Error("Invalid team");
  if (!isValidPosition(position)) throw new Error("Invalid position");

  const pos = sanitizePosition(position);
  // NE PAS re-floor par la suite, on veut des floats qui bougent

  const baseSpeeds: Record<TroopType, number> = {
    GIANT: 1.2,        // ~1.2 cellules/sec
    BABY_DRAGON: 1.6,
    MINI_PEKKA: 1.8,
    VALKYRIE: 1.5,
  };

  const dir = (team === "red") ? { dr: +1, dc: 0 } : { dr: -1, dc: 0 };

  const costs: Record<TroopType, number> = {
    GIANT: 5,
    BABY_DRAGON: 4,
    MINI_PEKKA: 3,
    VALKYRIE: 4,
  };

  if (game.elixir[team] < costs[troop_type]) {
    // Pas d'insertion si elixir insuffisant
    return game;
  }

  const troop: Troop = {
    id: `${troop_type}_${team}_${game.troops.length}_${Math.random().toString(16).slice(2, 8)}`,
    type: troop_type,
    team,
    position: { row: pos.row, col: pos.col }, // garder floats
    health: 100,
    max_health: 100,
    spawned_at: new Date().toISOString(),
    speed: baseSpeeds[troop_type],
    dir,
  };

  game.troops.push(troop);
  game.elixir[team] -= costs[troop_type];
  games.set(id, game);
  return game;
}

export function updateGameTime(id: string): GameState | null {
  const game = games.get(id);
  if (!game) return null;

  const nowMs = Date.now();
  const dt = Math.max(0, (nowMs - game.last_update_ms) / 1000); // en secondes
  game.last_update_ms = nowMs;

  // Temps de jeu à partir du start + dt pour robustesse
  const startTime = new Date(game.start_time).getTime();
  game.game_time = Math.floor((nowMs - startTime) / 1000);

  // Regen d'élixir
  const regen = game.elixir_rate * 0.1;
  game.elixir.red = Math.min(game.max_elixir, game.elixir.red + regen);
  game.elixir.blue = Math.min(game.max_elixir, game.elixir.blue + regen);

  // Mouvement simple des troupes: avance tout droit vers la King Tower adverse
  for (const t of game.troops) {
    if (t.health <= 0) continue;

    // cible colonne de la king adverse pour un léger recentrage horizontal
    const targetCol = (t.team === "red") ? game.towers.king_blue.position.col
                                         : game.towers.king_red.position.col;

    // correction latérale douce vers la colonne cible
    const dc = Math.sign(targetCol - t.position.col) * 0.2; // 0.2 cell/s max en latéral
    const dr = t.dir.dr;                                     // avance principale

    const stepR = (dr) * t.speed * dt;
    const stepC = (dc) * dt;

    t.position.row = clamp(t.position.row + stepR, 0, BOARD_ROWS - 1);
    t.position.col = clamp(t.position.col + stepC, 0, BOARD_COLS - 1);

    // stop si atteint la ligne de la king adverse
    const goalRow = (t.team === "red") ? game.towers.king_blue.position.row
                                       : game.towers.king_red.position.row;
    if (Math.abs(t.position.row - goalRow) < 0.5) {
      t.speed = 0; // s'arrête pour l'instant
    }
  }

  games.set(id, game);
  return game;
}
