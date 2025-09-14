import { TowerData, TowerType, TOWER_CONFIGS } from '@shared/tower';
import { Position } from '@shared/troop';
import { TroopData } from '@shared/troop';
import { GameEngine } from '../../core/GameEngine';

export class TowerEntity {
  public data: TowerData;

  constructor(id: string, type: TowerType, team: 'red' | 'blue', position: Position) {
    const config = TOWER_CONFIGS[type];

    this.data = {
      id,
      type,
      team,
      position,
      health: config.maxHealth,
      maxHealth: config.maxHealth,
      isAlive: true,
      active: type === TowerType.PRINCESS, // Princess towers start active, King tower becomes active when a princess is destroyed
      damage: config.damage,
      attackSpeed: config.attackSpeed,
      range: config.range,
      lastAttackTime: -1 // -1 to allow first attack immediately
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

  public isInRange(targetPosition: Position): boolean {
    const distance = Math.sqrt(
      Math.pow(targetPosition.row - this.data.position.row, 2) +
      Math.pow(targetPosition.col - this.data.position.col, 2)
    );
    return distance <= this.data.range;
  }

  public findTargetInRange(enemies: TroopData[]): TroopData | null {
    if (!this.data.active || !this.data.isAlive) return null;

    const enemyTeam = this.data.team === 'red' ? 'blue' : 'red';
    const enemiesInRange = enemies.filter(enemy =>
      enemy.team === enemyTeam &&
      enemy.isAlive &&
      this.isInRange(enemy.position)
    );

    if (enemiesInRange.length === 0) return null;

    // Find closest enemy
    let closestEnemy = enemiesInRange[0];
    let closestDistance = closestEnemy ? Math.sqrt(
      Math.pow(closestEnemy.position.row - this.data.position.row, 2) +
      Math.pow(closestEnemy.position.col - this.data.position.col, 2)
    ) : 0;

    for (const enemy of enemiesInRange) {
      const distance = Math.sqrt(
        Math.pow(enemy.position.row - this.data.position.row, 2) +
        Math.pow(enemy.position.col - this.data.position.col, 2)
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }

    return closestEnemy || null;
  }

  public update(_deltaTime: number, enemies: TroopData[], alliedTowers: TowerData[], gameEngine: GameEngine): void {
    if (!this.data.isAlive) return;

    // Update canAttack for King tower
    if (this.data.type === TowerType.KING) {
      this.updateCanAttackStatus(alliedTowers);
    }

    if (!this.data.active) return;

    // Find a target
    const target = this.findTargetInRange(enemies);

    if (!target) {
      return;
    }

    // Check if we can attack (cooldown)
    const currentTime = Date.now() / 1000;
    const timeSinceLastAttack = currentTime - this.data.lastAttackTime;

    if (timeSinceLastAttack >= this.data.attackSpeed) {
      this.performAttack(target, gameEngine);
      this.data.lastAttackTime = currentTime;
    }
  }

  private performAttack(target: TroopData, gameEngine: GameEngine): void {
    console.log(`Tower ${this.data.id} (${this.data.type}) attacks ${target.id} for ${this.data.damage} damage!`);

    // Deal damage through game engine
    gameEngine.dealDamageToTroop(target.id, this.data.damage);
  }

  public updateCanAttackStatus(alliedTowers: TowerData[]): void {
    if (this.data.type === TowerType.KING) {
      const allyPrincessTowers = alliedTowers.filter(tower =>
        tower.team === this.data.team &&
        tower.type === TowerType.PRINCESS
      );
      const alivePrincessCount = allyPrincessTowers.filter(tower => tower.isAlive).length;

      // King tower can attack if at least one princess tower is destroyed
      const shouldBeActive = alivePrincessCount < 2;

      if (shouldBeActive && !this.data.active) {
        this.data.active = true;
        console.log(`King tower ${this.data.id} can now attack! Princess towers destroyed: ${2 - alivePrincessCount}`);
      }
    }
  }
}