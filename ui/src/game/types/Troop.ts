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
  BABY_DRAGON = 'babyDragon',
  MINI_PEKKA = 'miniPekka',
  VALKYRIE = 'valkyrie'
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
  scale: number | {
    walk: number;
    fight: number;
  };
}

export const TROOP_CONFIGS: Record<TroopType, TroopConfig> = {
  [TroopType.GIANT]: {
    // Statistiques niveau 11 officielles Clash Royale
    maxHealth: 4416, // Points de vie niveau 11
    speed: 1.2, // Vitesse de déplacement (moyenne)
    attackDamage: 253, // Dégâts par attaque niveau 11
    attackSpeed: 1.9, // Vitesse d'attaque (1.9 seconde)
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
    attackSpeed: 1.05, // Vitesse d'attaque (1.05 seconde)
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
  },
  [TroopType.MINI_PEKKA]: {
    // Statistiques niveau 11 officielles Clash Royale
    maxHealth: 1361, // Points de vie niveau 11
    speed: 1.8, // Vitesse de déplacement (rapide)
    attackDamage: 720, // Dégâts par attaque niveau 11 (très élevés)
    attackSpeed: 1.8, // Vitesse d'attaque (1.8 seconde)
    gifPaths: {
      walk: {
        player: '/images/troops/minipekka/MiniPekka_walk_player_62-62.gif',
        opponent: '/images/troops/minipekka/MiniPekka_walk_opponent_62-62.gif'
      },
      fight: {
        player: '/images/troops/minipekka/MiniPekka_fight_player_66-54.gif',
        opponent: '/images/troops/minipekka/MiniPekka_fight_opponent_66-54.gif'
      }
    },
    focusOnBuildings: false, // Cible le plus proche (troupe ou tour)
    flying: false,
    scale: 2.0
  },
  [TroopType.VALKYRIE]: {
    // Statistiques niveau 11 officielles Clash Royale
    maxHealth: 1908, // Points de vie niveau 11
    speed: 1.5, // Vitesse de déplacement (moyenne)
    attackDamage: 267, // Dégâts par attaque niveau 11 (attaque en zone)
    attackSpeed: 267/169, // Vitesse d'attaque
    gifPaths: {
      walk: {
        player: '/images/troops/valkyrie/Valkyrie_walk_player_46-52.gif',
        opponent: '/images/troops/valkyrie/Valkyrie_walk_opponent_46-52.gif'
      },
      fight: {
        player: '/images/troops/valkyrie/Valkyrie_fight_player_132-132.gif',
        opponent: '/images/troops/valkyrie/Valkyrie_fight_opponent_132-132.gif'
      }
    },
    focusOnBuildings: false, // Cible le plus proche (troupe ou tour)
    flying: false,
    scale: {
      walk: 1.5,  // Scale 0.7 pour la marche
      fight: 4.2  // Scale x3 de l'ancien 2.2 = 6.6 pour l'attaque
    }
  }
};

// Positions communes pour toutes les troupes
export const BRIDGES: Position[] = [
  { row: 16, col: 3 },
  { row: 16, col: 14 }
];
