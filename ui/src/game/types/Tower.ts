export interface Position {
  row: number;
  col: number;
}

export interface Tower {
  id: string;
  type: 'king' | 'princess';
  team: 'red' | 'blue';
  row: number;
  col: number;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  active: boolean;
  position: Position;
  // Propriétés d'affichage
  offsetX?: number;
  offsetY?: number;
  // Propriété pour compatibilité avec les entités
  data?: Tower;
}

export interface TowerConfig {
  maxHealth: number;
  damage: number;
  attackSpeed: number;
  range: number;
}

// Configuration des tours niveau 11 (statistiques officielles Clash Royale)
export const TOWER_CONFIGS: Record<string, TowerConfig> = {
  king: {
    maxHealth: 4_824, // Tour du roi niveau 11
    damage: 109, // Dégâts par attaque
    attackSpeed: 1.0, // Attaques par seconde
    range: 7.0 // Portée d'attaque
  },
  princess: {
    maxHealth: 3_052, // Tours des princesses niveau 11
    damage: 109, // Dégâts par attaque
    attackSpeed: 136/109, // Attaques par seconde
    range: 7.0 // Portée d'attaque
  }
};

export class TowerEntity {
  public data: Tower;

  constructor(id: string, type: 'king' | 'princess', team: 'red' | 'blue', row: number, col: number) {
    const config = TOWER_CONFIGS[type];
    
    this.data = {
      id,
      type,
      team,
      row,
      col,
      health: config.maxHealth,
      maxHealth: config.maxHealth,
      isAlive: true,
      active: true,
      position: { row, col }
    };
  }

  public takeDamage(damage: number): void {
    if (!this.data.isAlive) return;
    
    this.data.health -= damage;
    console.log(`Tower ${this.data.id} (${this.data.type}) takes ${damage} damage! Health: ${this.data.health}/${this.data.maxHealth}`);
    
    if (this.data.health <= 0) {
      this.data.health = 0;
      this.data.isAlive = false;
      this.data.active = false;
      console.log(`Tower ${this.data.id} (${this.data.type}) has been destroyed!`);
    }
  }

  public getHealthPercentage(): number {
    return (this.data.health / this.data.maxHealth) * 100;
  }

  public isInRange(targetRow: number, targetCol: number): boolean {
    const config = TOWER_CONFIGS[this.data.type];
    const distance = Math.sqrt(
      Math.pow(targetRow - this.data.row, 2) +
      Math.pow(targetCol - this.data.col, 2)
    );
    return distance <= config.range;
  }
}
