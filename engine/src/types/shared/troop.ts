export interface Position {
  row: number;
  col: number;
}

export enum TroopState {
  SPAWNING = 'SPAWNING',
  MOVING_TO_BRIDGE = 'MOVING_TO_BRIDGE',
  TARGETING_TOWER = 'TARGETING_TOWER',
  ATTACKING_TOWER = 'ATTACKING_TOWER',
  DEAD = 'DEAD'
}

export enum TroopType {
  GIANT = 'giant',
  BABY_DRAGON = 'babyDragon',
  MINI_PEKKA = 'miniPekka',
  VALKYRIE = 'valkyrie'
}

export interface TroopData {
  id: string;
  type: TroopType;
  team: 'red' | 'blue';
  position: Position;
  targetPosition: Position;
  state: TroopState;
  health: number;
  maxHealth: number;
  speed: number; // cells per second
  isAlive: boolean;
  bridgeTarget?: Position;
  towerTarget?: string; // Tower ID
  isInCombat: boolean;
  attackDamage: number;
  attackSpeed: number; // attacks per second
  lastAttackTime: number;
  focusOnBuildings: boolean;
  flying: boolean;
  row: number;
  col: number;
  spawnTime: number;
  lastUpdateTime: number;
}

export interface TroopConfig {
  maxHealth: number;
  speed: number;
  attackDamage: number;
  attackSpeed: number;
  focusOnBuildings: boolean;
  flying: boolean;
  cost: number;
  range: number;
}

export const TROOP_CONFIGS: Record<TroopType, TroopConfig> = {
  [TroopType.GIANT]: {
    maxHealth: 5_092,
    speed: 1.0,
    attackDamage: 287,
    attackSpeed: 1.5,
    focusOnBuildings: true,
    flying: false,
    cost: 5,
    range: 1.2
  },
  [TroopType.BABY_DRAGON]: {
    maxHealth: 1_264,
    speed: 2.0,
    attackDamage: 151,
    attackSpeed: 1.5,
    focusOnBuildings: false,
    flying: true,
    cost: 4,
    range: 3.5
  },
  [TroopType.MINI_PEKKA]: {
    maxHealth: 1_361,
    speed: 2.0,
    attackDamage: 718,
    attackSpeed: 1.6,
    focusOnBuildings: false,
    flying: false,
    cost: 4,
    range: 1.2
  },
  [TroopType.VALKYRIE]: {
    maxHealth: 2_206,
    speed: 1.5,
    attackDamage: 260,
    attackSpeed: 1.5,
    focusOnBuildings: false,
    flying: false,
    cost: 4,
    range: 1.2
  }
};