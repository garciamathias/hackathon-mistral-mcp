export interface Position {
  row: number;
  col: number;
}

export enum TroopState {
  SPAWNING,
  MOVING_TO_BRIDGE,
  TARGETING_TOWER,
  ATTACKING_TOWER,
  DEAD
}

export enum TroopType {
  GIANT = 'giant',
  BABY_DRAGON = 'babyDragon'
}

export interface BaseTroop {
  id: string;
  type: TroopType;
  team: 'red' | 'blue';
  position: Position;
  targetPosition: Position;
  state: TroopState;
  health: number;
  maxHealth: number;
  speed: number; // cellules par seconde
  isAlive: boolean;
  bridgeTarget?: Position;
  towerTarget?: string; // ID de la tour ciblée
  isInCombat: boolean;
  attackDamage: number;
  attackSpeed: number; // attaques par seconde
  lastAttackTime: number;
}

export interface TroopEntity {
  data: BaseTroop;
  update(deltaTime: number, towers: any[], flaggedCells: Set<string>): void;
}

// Configuration pour chaque type de troupe
export interface TroopConfig {
  maxHealth: number;
  speed: number;
  attackDamage: number;
  attackSpeed: number;
  gifPaths: {
    walk: {
      player: string;
      opponent: string;
    };
    fight: {
      player: string;
      opponent: string;
    };
  };
  scale: number;
}

export const TROOP_CONFIGS: Record<TroopType, TroopConfig> = {
  [TroopType.GIANT]: {
    maxHealth: 3000,
    speed: 1.2,
    attackDamage: 300,
    attackSpeed: 1.5,
    gifPaths: {
      walk: {
        player: '/images/troops/giant/Giant_walk_player.gif',
        opponent: '/images/troops/giant/Giant_walk_opponent.gif'
      },
      fight: {
        player: '/images/troops/giant/Giant_fight_player.gif',
        opponent: '/images/troops/giant/Giant_fight_opponent.gif'
      }
    },
    scale: 3
  },
  [TroopType.BABY_DRAGON]: {
    maxHealth: 800,
    speed: 2.0,
    attackDamage: 200,
    attackSpeed: 1.8,
    gifPaths: {
      walk: {
        player: '/images/troops/babydragon/BabyDragon_walk_player.gif',
        opponent: '/images/troops/babydragon/BabyDragon_walk_opponent.gif'
      },
      fight: {
        player: '/images/troops/babydragon/BabyDragon_fight_player.gif',
        opponent: '/images/troops/babydragon/BabyDragon_fight_opponent.gif'
      }
    },
    scale: 2.5
  }
};

// Positions communes pour toutes les troupes
export const BRIDGES: Position[] = [
  { row: 16, col: 3 },
  { row: 16, col: 14 }
];
