// src/lib/gameStore.ts
import { v4 as uuidv4 } from "uuid";

export type TroopType = "GIANT" | "BABY_DRAGON" | "MINI_PEKKA" | "VALKYRIE";
export type Team = "red" | "blue";

export interface Troop {
  id: string;
  type: TroopType;
  team: Team;
  position: { row: number; col: number };
  health: number;
  max_health: number;
  spawned_at: string;
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
}

const games = new Map<string, GameState>();

// === HELPERS ===
function defaultTowers(): Record<string, Tower> {
  return {
    king_red: {
      id: "king_red",
      team: "red",
      type: "king",
      health: 100,
      max_health: 100,
      position: { row: 2, col: 8 },
    },
    princess_red_left: {
      id: "princess_red_left",
      team: "red",
      type: "princess",
      health: 100,
      max_health: 100,
      position: { row: 6, col: 3 },
    },
    princess_red_right: {
      id: "princess_red_right",
      team: "red",
      type: "princess",
      health: 100,
      max_health: 100,
      position: { row: 6, col: 14 },
    },
    king_blue: {
      id: "king_blue",
      team: "blue",
      type: "king",
      health: 100,
      max_health: 100,
      position: { row: 31, col: 8 },
    },
    princess_blue_left: {
      id: "princess_blue_left",
      team: "blue",
      type: "princess",
      health: 100,
      max_health: 100,
      position: { row: 27, col: 3 },
    },
    princess_blue_right: {
      id: "princess_blue_right",
      team: "blue",
      type: "princess",
      health: 100,
      max_health: 100,
      position: { row: 27, col: 14 },
    },
  };
}

export function createGame(): GameState {
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
    start_time: new Date().toISOString(),
    is_game_over: false,
    winner: null,
    tactical_analysis: "Equal troop count on battlefield. Early game: Focus on elixir trades and chip damage",
  };
  games.set(id, state);
  return state;
}

export function getGame(id: string): GameState | null {
  return games.get(id) || null;
}

export function spawnTroop(
  id: string,
  troop_type: TroopType,
  team: Team,
  position: { row: number; col: number }
): GameState | null {
  const game = games.get(id);
  if (!game) return null;

  const costs: Record<TroopType, number> = {
    GIANT: 5,
    BABY_DRAGON: 4,
    MINI_PEKKA: 3,
    VALKYRIE: 4,
  };

  if (game.elixir[team] < costs[troop_type]) return game;

  const troop: Troop = {
    id: `${troop_type}_${team}_${game.troops.length}_${Math.random().toString(16).slice(2, 8)}`,
    type: troop_type,
    team,
    position,
    health: 100,
    max_health: 100,
    spawned_at: new Date().toISOString(),
  };

  game.troops.push(troop);
  game.elixir[team] -= costs[troop_type];
  games.set(id, game);
  return game;
}

// Mettre à jour le temps de jeu
export function updateGameTime(id: string): GameState | null {
  const game = games.get(id);
  if (!game) return null;

  const now = new Date();
  const startTime = new Date(game.start_time);
  game.game_time = Math.floor((now.getTime() - startTime.getTime()) / 1000);
  
  // Régénérer l'elixir
  game.elixir.red = Math.min(game.max_elixir, game.elixir.red + game.elixir_rate * 0.1);
  game.elixir.blue = Math.min(game.max_elixir, game.elixir.blue + game.elixir_rate * 0.1);
  
  games.set(id, game);
  return game;
}
