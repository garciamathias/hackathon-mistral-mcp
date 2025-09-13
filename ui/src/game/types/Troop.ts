import { Tower } from './Tower';

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
  focusOnBuildings: boolean;
  flying: boolean;
  row: number;
  col: number;
  // Propriété pour compatibilité avec les entités
  data?: BaseTroop;
}

export interface TargetResult {
  target: {
    id: string;
    type: string;
    row?: number;
    col?: number;
    position?: Position;
    team?: string;
  };
  distance: number;
}

export interface GameEngine {
  findClosestEnemy(troop: BaseTroop): TargetResult | null;
  getTowerEntity(id: string): { data: Tower; takeDamage: (damage: number) => void } | undefined;
  getAllTroops(): BaseTroop[];
}

export interface TroopEntity {
  data: BaseTroop;
  update(deltaTime: number, towers: Tower[], flaggedCells: Set<string>, gameEngine?: GameEngine): void;
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
  focusOnBuildings: boolean;
  flying: boolean;
  scale: number;
}

export const TROOP_CONFIGS: Record<TroopType, TroopConfig> = {
  [TroopType.GIANT]: {
    // Statistiques niveau 11 officielles Clash Royale
    maxHealth: 4416, // Points de vie niveau 11
    speed: 1.2, // Vitesse de déplacement (moyenne)
    attackDamage: 253, // Dégâts par attaque niveau 11
    attackSpeed: 1.5, // Vitesse d'attaque (1.5 seconde)
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
    focusOnBuildings: true, // Cible uniquement les bâtiments
    flying: false,
    scale: 3
  },
  [TroopType.BABY_DRAGON]: {
    // Statistiques niveau 11 officielles Clash Royale
    maxHealth: 1152, // Points de vie niveau 11
    speed: 2.0, // Vitesse de déplacement (rapide)
    attackDamage: 161, // Dégâts par attaque niveau 11
    attackSpeed: 1.5, // Vitesse d'attaque (1.5 seconde)
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
    scale: 2.5,
    focusOnBuildings: false, // Cible le plus proche (troupe ou tour)
    flying: true // Ignore les flagged cells
  }
};

// Positions communes pour toutes les troupes
export const BRIDGES: Position[] = [
  { row: 16, col: 3 },
  { row: 16, col: 14 }
];
