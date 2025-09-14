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
  // Propriétés d'attaque
  currentTarget?: string; // ID de la cible actuelle
  lastAttackTime: number;
  isAttacking: boolean;
  canAttack: boolean; // Pour le roi : true si au moins une princess alliée est détruite
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
    range: 10.0 // Portée d'attaque avec flèches
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
      position: { row, col },
      // Propriétés d'attaque
      currentTarget: undefined,
      lastAttackTime: -1, // -1 pour permettre la première attaque immédiatement
      isAttacking: false,
      canAttack: type === 'princess' // Princess peut toujours attaquer, King seulement si princess détruite
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

  public findTargetInRange(enemies: any[]): any | null {
    if (!this.data.canAttack || !this.data.isAlive) return null;

    const enemyTeam = this.data.team === 'red' ? 'blue' : 'red';
    const enemiesInRange = enemies.filter(enemy => 
      enemy.team === enemyTeam && 
      enemy.isAlive && 
      this.isInRange(enemy.position.row, enemy.position.col)
    );

    if (enemiesInRange.length === 0) return null;

    // Trouver l'ennemi le plus proche
    let closestEnemy = enemiesInRange[0];
    let closestDistance = Math.sqrt(
      Math.pow(closestEnemy.position.row - this.data.row, 2) +
      Math.pow(closestEnemy.position.col - this.data.col, 2)
    );

    for (const enemy of enemiesInRange) {
      const distance = Math.sqrt(
        Math.pow(enemy.position.row - this.data.row, 2) +
        Math.pow(enemy.position.col - this.data.col, 2)
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }

    return closestEnemy;
  }

  public update(deltaTime: number, enemies: any[], alliedTowers: any[], gameEngine?: any): void {
    if (!this.data.isAlive) return;

    // Mettre à jour canAttack pour le roi
    if (this.data.type === 'king') {
      const allyPrincessTowers = alliedTowers.filter(tower => 
        tower.team === this.data.team && 
        tower.type === 'princess'
      );
      const alivePrincessCount = allyPrincessTowers.filter(tower => tower.isAlive).length;
      this.data.canAttack = alivePrincessCount < 2; // Peut attaquer si au moins une princess est détruite
    }

    if (!this.data.canAttack) return;

    // Chercher une cible
    const target = this.findTargetInRange(enemies);
    
    if (!target) {
      this.data.currentTarget = undefined;
      this.data.isAttacking = false;
      return;
    }

    this.data.currentTarget = target.id;

    // Vérifier si on peut attaquer (cooldown)
    const currentTime = performance.now() / 1000;
    const config = TOWER_CONFIGS[this.data.type];
    const timeSinceLastAttack = currentTime - this.data.lastAttackTime;

    if (timeSinceLastAttack >= config.attackSpeed) {
      this.performAttack(target, gameEngine);
      this.data.lastAttackTime = currentTime;
      this.data.isAttacking = true;
    }
  }

  private performAttack(target: any, gameEngine?: any): void {
    const config = TOWER_CONFIGS[this.data.type];
    console.log(`Tower ${this.data.id} (${this.data.type}) attacks ${target.id} for ${config.damage} damage!`);
    
    // Trouver l'entité de la troupe cible dans le GameEngine
    if (gameEngine && gameEngine.getTroopEntity) {
      const targetEntity = gameEngine.getTroopEntity(target.id);
      if (targetEntity && typeof targetEntity.takeDamage === 'function') {
        targetEntity.takeDamage(config.damage);
        return;
      }
    }
    
    // Fallback vers les méthodes directes
    if (target.takeDamage && typeof target.takeDamage === 'function') {
      target.takeDamage(config.damage);
    } else if (target.data && typeof target.data.takeDamage === 'function') {
      target.data.takeDamage(config.damage);
    } else {
      console.warn(`Target ${target.id} doesn't have takeDamage method! Target type: ${typeof target}, Keys: ${Object.keys(target)}`);
    }
  }

  public updateCanAttackStatus(alliedTowers: any[]): void {
    if (this.data.type === 'king') {
      const allyPrincessTowers = alliedTowers.filter(tower => 
        tower.team === this.data.team && 
        tower.type === 'princess'
      );
      const alivePrincessCount = allyPrincessTowers.filter(tower => tower.isAlive).length;
      this.data.canAttack = alivePrincessCount < 2;
      
      if (this.data.canAttack) {
        console.log(`King tower ${this.data.id} can now attack! Princess towers destroyed: ${2 - alivePrincessCount}`);
      }
    }
  }
}
