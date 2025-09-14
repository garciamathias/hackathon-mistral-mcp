import { Position } from './troop';

export enum TowerType {
  KING = 'king',
  PRINCESS = 'princess'
}

export interface TowerData {
  id: string;
  type: TowerType;
  team: 'red' | 'blue';
  position: Position;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  active: boolean;
  damage: number;
  attackSpeed: number;
  range: number;
  lastAttackTime: number;
}

export interface TowerConfig {
  maxHealth: number;
  damage: number;
  attackSpeed: number;
  range: number;
}

// Level 11 tower stats (official Clash Royale)
export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  [TowerType.KING]: {
    maxHealth: 4_824,
    damage: 109,
    attackSpeed: 1.0,
    range: 7.0
  },
  [TowerType.PRINCESS]: {
    maxHealth: 3_052,
    damage: 109,
    attackSpeed: 0.8,
    range: 8.5
  }
};

// Tower positions on the grid
export const TOWER_POSITIONS = {
  red: {
    king: { row: 2, col: 8 },
    princessLeft: { row: 6, col: 3 },
    princessRight: { row: 6, col: 14 }
  },
  blue: {
    king: { row: 31, col: 8 },
    princessLeft: { row: 27, col: 3 },
    princessRight: { row: 27, col: 14 }
  }
};