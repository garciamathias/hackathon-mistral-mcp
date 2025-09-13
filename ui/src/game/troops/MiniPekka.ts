export enum MiniPekkaState {
  SPAWNING = TroopState.SPAWNING,
  MOVING_TO_BRIDGE = TroopState.MOVING_TO_BRIDGE,
  SEEKING_TARGET = TroopState.TARGETING_TOWER,
  ATTACKING_TARGET = TroopState.ATTACKING_TOWER,
  DEAD = TroopState.DEAD
}

export interface MiniPekkaPosition {
  row: number;
  col: number;
}

import { TroopType, TROOP_CONFIGS, TroopState, BaseTroop } from '../types/Troop';
import { Tower } from '../types/Tower';
import { GameEngine } from '../GameEngine';
import { TroopUtils } from '../utils/troop_utils';

export interface MiniPekka {
  id: string;
  type: TroopType.MINI_PEKKA;
  team: 'red' | 'blue';
  position: MiniPekkaPosition;
  targetPosition: MiniPekkaPosition;
  state: MiniPekkaState;
  health: number;
  maxHealth: number;
  speed: number; // cellules par seconde
  isAlive: boolean;
  bridgeTarget?: MiniPekkaPosition;
  towerTarget?: string; // ID de la tour ciblée
  isInCombat: boolean;
  attackDamage: number;
  attackSpeed: number; // attaques par seconde
  lastAttackTime: number;
  flying: boolean;
  focusOnBuildings: boolean;
  row: number;
  col: number;
}

// Positions des ponts
export const BRIDGES: MiniPekkaPosition[] = [
  { row: 16, col: 3 },
  { row: 16, col: 14 }
];

export class MiniPekkaEntity {
  public data: MiniPekka;

  constructor(id: string, team: 'red' | 'blue', customPosition?: MiniPekkaPosition) {
    const defaultPosition = { row: 0, col: 0 };
    const startPosition = customPosition || defaultPosition;
    const config = TROOP_CONFIGS[TroopType.MINI_PEKKA];

    this.data = {
      id,
      type: TroopType.MINI_PEKKA,
      team,
      position: { ...startPosition },
      targetPosition: { ...startPosition },
      state: MiniPekkaState.SPAWNING,
      health: config.maxHealth,
      maxHealth: config.maxHealth,
      speed: config.speed,
      isAlive: true,
      bridgeTarget: undefined,
      towerTarget: undefined,
      isInCombat: false,
      attackDamage: config.attackDamage,
      attackSpeed: config.attackSpeed,
      lastAttackTime: -1, // -1 pour permettre la première attaque immédiatement
      flying: config.flying,
      focusOnBuildings: config.focusOnBuildings,
      row: startPosition.row,
      col: startPosition.col
    };

    console.log(`MiniPekka ${team} spawned at (${startPosition.row}, ${startPosition.col}) - focusOnBuildings: ${config.focusOnBuildings}, flying: ${config.flying}`);
  }

  public update(deltaTime: number, activeTowers: Tower[], flaggedCells?: Set<string>, gameEngine?: GameEngine): void {
    if (!this.data.isAlive) return;

    switch (this.data.state) {
      case MiniPekkaState.SPAWNING:
        // Utiliser TroopUtils pour déterminer la stratégie
        const newState = TroopUtils.handleSpawningTransition(this.data as unknown as BaseTroop, activeTowers, gameEngine);
        this.data.state = newState as unknown as MiniPekkaState;
        
        if (newState === TroopState.MOVING_TO_BRIDGE) {
          // Choisir le pont le plus proche
          const bridgeTarget = TroopUtils.chooseBridge(this.data as unknown as BaseTroop);
          this.data.bridgeTarget = bridgeTarget;
          this.data.targetPosition = { ...bridgeTarget };
        }
        break;

      case MiniPekkaState.MOVING_TO_BRIDGE:
        const bridgeState = TroopUtils.handleMovingToBridge(
          this.data as unknown as BaseTroop,
          deltaTime,
          flaggedCells,
          gameEngine,
          (target, dt, flagged) => this.moveTowards(target, dt, flagged),
          (target) => this.isAtPosition(target)
        );
        this.data.state = bridgeState as unknown as MiniPekkaState;
        break;

      case MiniPekkaState.SEEKING_TARGET:
        // Si pas encore de cible définie, en trouver une
        if (!this.data.towerTarget) {
          TroopUtils.findAndTargetEnemy(
            this.data as unknown as BaseTroop,
            activeTowers,
            gameEngine,
            (targetId, targetPosition) => {
              this.data.towerTarget = targetId;
              this.data.targetPosition = targetPosition;
            },
            (towers) => this.findAndTargetEnemyTower(towers)
          );
        }
        
        // Vérifier si la cible actuelle est toujours active
        if (this.data.towerTarget) {
          if (!this.isTargetStillValid(activeTowers, gameEngine)) {
            this.data.towerTarget = undefined;
            this.data.isInCombat = false;
            break;
          }
        }
        
        // Mettre à jour la position de la cible actuelle (importante pour les cibles mobiles)
        if (this.data.towerTarget && gameEngine) {
          this.updateTargetPosition(activeTowers, gameEngine);
        }
        
        // Recalculer la cible la plus proche si pas en combat
        if (!this.data.isInCombat && gameEngine) {
          const closestEnemyResult = gameEngine.findClosestEnemy(this.data as unknown as BaseTroop);
          if (closestEnemyResult && this.data.towerTarget !== closestEnemyResult.target.id) {
            const currentDistance = this.getDistanceToTarget();
            if (closestEnemyResult.distance < currentDistance - 1.0) {
              console.log(`MiniPekka ${this.data.id} retargeting from ${this.data.towerTarget} to closer enemy ${closestEnemyResult.target.id}`);
              const { target } = closestEnemyResult;
              this.data.towerTarget = target.id;
              this.data.targetPosition = { 
                row: target.type === 'tower' ? target.row : target.position.row, 
                col: target.type === 'tower' ? target.col : target.position.col 
              };
            }
          }
        }
        
        if (this.data.towerTarget) {
          // Vérifier la distance à la cible AVANT de bouger
          const distanceToTarget = this.getDistanceToTarget();
          
          if (distanceToTarget <= 1.2) { // Range d'attaque plus courte pour MiniPekka
            console.log(`MiniPekka ${this.data.id} entering combat mode! Distance: ${distanceToTarget.toFixed(2)}`);
            this.data.isInCombat = true;
            this.data.state = MiniPekkaState.ATTACKING_TARGET;
          } else {
            // Vérifier si le MiniPekka est bloqué par les flagged cells de sa cible
            const targetTower = activeTowers.find(tower => tower.id === this.data.towerTarget);
            if (flaggedCells && targetTower && this.isBlockedByTargetFlaggedCells(flaggedCells, targetTower)) {
              console.log(`MiniPekka ${this.data.id} is blocked by target's flagged cells, entering combat mode!`);
              this.data.isInCombat = true;
              this.data.state = MiniPekkaState.ATTACKING_TARGET;
            } else {
              // Se déplacer vers la cible en vérifiant si on arrive à portée pendant le mouvement
              this.moveTowardsWithRangeCheck(this.data.targetPosition, deltaTime, flaggedCells, 1.2);
            }
          }
        }
        break;

      case MiniPekkaState.ATTACKING_TARGET:
        // Vérifier si la cible est toujours active avant d'attaquer
        if (this.data.towerTarget) {
          if (!this.isTargetStillValid(activeTowers, gameEngine)) {
            this.data.towerTarget = undefined;
            this.data.isInCombat = false;
            this.data.state = MiniPekkaState.SEEKING_TARGET;
            break;
          }
        }
        
        // Mettre à jour la position de la cible même en combat
        if (this.data.towerTarget && gameEngine) {
          this.updateTargetPosition(activeTowers, gameEngine);
        }
        
        // Vérifier si le MiniPekka est bloqué par les flagged cells
        const targetTower = activeTowers.find(tower => tower.id === this.data.towerTarget);
        const isBlockedByFlaggedCells = !!(flaggedCells && this.data.towerTarget && targetTower &&
          this.isBlockedByTargetFlaggedCells(flaggedCells, targetTower));
        
        this.attackTarget(deltaTime, activeTowers, gameEngine, isBlockedByFlaggedCells);
        break;
    }
  }

  private isTargetStillValid(activeTowers: Tower[], gameEngine?: GameEngine): boolean {
    if (!this.data.towerTarget) return false;

    // Vérifier d'abord si c'est une tour
    const targetTower = activeTowers.find(tower => tower.id === this.data.towerTarget);
    if (targetTower) {
      if (!targetTower.isAlive) {
        console.log(`MiniPekka ${this.data.id} target tower ${this.data.towerTarget} is dead`);
        return false;
      }
      return true;
    }

    // Sinon vérifier si c'est une troupe
    if (gameEngine) {
      const targetTroop = gameEngine.getTroopEntity(this.data.towerTarget);
      if (!targetTroop || !targetTroop.data.isAlive) {
        console.log(`MiniPekka ${this.data.id} target troop ${this.data.towerTarget} is dead`);
        return false;
      }
      // Check if target is a flying troop (MiniPekkas can't target flying troops)
      if (targetTroop.data.flying) {
        console.log(`MiniPekka ${this.data.id} target troop ${this.data.towerTarget} is flying and cannot be targeted`);
        return false;
      }
      return true;
    }

    return false;
  }

  private moveTowardsWithRangeCheck(target: MiniPekkaPosition, deltaTime: number, flaggedCells?: Set<string>, stopRange?: number): void {
    const { position, speed } = this.data;
    
    const dx = target.col - position.col;
    const dy = target.row - position.row;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.1) {
      this.data.position = { ...target };
      return;
    }

    if (stopRange && distance <= stopRange) {
      console.log(`MiniPekka ${this.data.id} stopping movement - in range! Distance: ${distance.toFixed(2)}`);
      this.data.isInCombat = true;
      this.data.state = MiniPekkaState.ATTACKING_TARGET;
      return;
    }

    const moveDistance = speed * deltaTime;
    let normalizedDx = (dx / distance) * moveDistance;
    let normalizedDy = (dy / distance) * moveDistance;

    if (stopRange && moveDistance >= distance - stopRange) {
      const targetDistance = Math.max(stopRange - 0.1, 0.1);
      const adjustedMoveDistance = distance - targetDistance;
      normalizedDx = (dx / distance) * adjustedMoveDistance;
      normalizedDy = (dy / distance) * adjustedMoveDistance;
    }

    const newPosition = {
      row: position.row + normalizedDy,
      col: position.col + normalizedDx
    };

    // MiniPekka n'est pas volant, donc vérifie les flagged cells
    if (!this.data.flying && flaggedCells && this.wouldCollideWithFlaggedCell(newPosition, flaggedCells)) {
      console.log(`MiniPekka ${this.data.id} (${this.data.team}) blocked by flagged cell`);
      
      const avoidanceDirection = this.calculateSmartAvoidance(position, target, flaggedCells, Math.sqrt(normalizedDx * normalizedDx + normalizedDy * normalizedDy));
      
      if (avoidanceDirection) {
        normalizedDx = avoidanceDirection.dx;
        normalizedDy = avoidanceDirection.dy;
      } else {
        return;
      }
    }

    this.data.position.col += normalizedDx;
    this.data.position.row += normalizedDy;
  }

  private moveTowards(target: MiniPekkaPosition, deltaTime: number, flaggedCells?: Set<string>): void {
    const { position, speed } = this.data;
    
    const dx = target.col - position.col;
    const dy = target.row - position.row;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.1) {
      this.data.position = { ...target };
      return;
    }

    const moveDistance = speed * deltaTime;
    let normalizedDx = (dx / distance) * moveDistance;
    let normalizedDy = (dy / distance) * moveDistance;

    const newPosition = {
      row: position.row + normalizedDy,
      col: position.col + normalizedDx
    };

    if (!this.data.flying && flaggedCells && this.wouldCollideWithFlaggedCell(newPosition, flaggedCells)) {
      const avoidanceDirection = this.calculateSmartAvoidance(position, target, flaggedCells, moveDistance);
      
      if (avoidanceDirection) {
        normalizedDx = avoidanceDirection.dx;
        normalizedDy = avoidanceDirection.dy;
      } else {
        return;
      }
    }

    this.data.position.col += normalizedDx;
    this.data.position.row += normalizedDy;
  }

  private wouldCollideWithFlaggedCell(position: MiniPekkaPosition, flaggedCells: Set<string>): boolean {
    const cellKey = `${Math.floor(position.row)}-${Math.floor(position.col)}`;
    return flaggedCells.has(cellKey);
  }

  private calculateSmartAvoidance(position: MiniPekkaPosition, target: MiniPekkaPosition, flaggedCells: Set<string>, moveDistance: number): {dx: number, dy: number} | null {
    const obstacleCenter = this.findObstacleCenter(position, flaggedCells);
    
    if (!obstacleCenter) return null;

    const isRightOfObstacle = position.col > obstacleCenter.col;
    const isLeftOfObstacle = position.col < obstacleCenter.col;
    const isAboveObstacle = position.row < obstacleCenter.row;
    const isBelowObstacle = position.row > obstacleCenter.row;

    let avoidanceDx = 0;
    let avoidanceDy = 0;

    if (Math.abs(target.row - position.row) > Math.abs(target.col - position.col)) {
      if (isRightOfObstacle) {
        avoidanceDx = moveDistance;
      } else if (isLeftOfObstacle) {
        avoidanceDx = -moveDistance;
      }
    } else {
      if (isAboveObstacle) {
        avoidanceDy = -moveDistance;
      } else if (isBelowObstacle) {
        avoidanceDy = moveDistance;
      }
    }

    const avoidancePosition = {
      row: position.row + avoidanceDy,
      col: position.col + avoidanceDx
    };

    if (!this.wouldCollideWithFlaggedCell(avoidancePosition, flaggedCells)) {
      return { dx: avoidanceDx, dy: avoidanceDy };
    }

    avoidanceDx = -avoidanceDx;
    avoidanceDy = -avoidanceDy;

    const alternativePosition = {
      row: position.row + avoidanceDy,
      col: position.col + avoidanceDx
    };

    if (!this.wouldCollideWithFlaggedCell(alternativePosition, flaggedCells)) {
      return { dx: avoidanceDx, dy: avoidanceDy };
    }

    return null;
  }

  private findObstacleCenter(position: MiniPekkaPosition, flaggedCells: Set<string>): MiniPekkaPosition | null {
    const nearbyFlaggedCells: MiniPekkaPosition[] = [];
    
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const checkPos = {
          row: Math.floor(position.row) + dr,
          col: Math.floor(position.col) + dc
        };
        
        if (this.wouldCollideWithFlaggedCell(checkPos, flaggedCells)) {
          nearbyFlaggedCells.push(checkPos);
        }
      }
    }

    if (nearbyFlaggedCells.length === 0) return null;

    const avgRow = nearbyFlaggedCells.reduce((sum, cell) => sum + cell.row, 0) / nearbyFlaggedCells.length;
    const avgCol = nearbyFlaggedCells.reduce((sum, cell) => sum + cell.col, 0) / nearbyFlaggedCells.length;

    return { row: avgRow, col: avgCol };
  }

  private isAtPosition(target: MiniPekkaPosition): boolean {
    const dx = this.data.position.col - target.col;
    const dy = this.data.position.row - target.row;
    return Math.sqrt(dx * dx + dy * dy) < 0.5;
  }

  private getDistanceToTarget(): number {
    const dx = this.data.targetPosition.col - this.data.position.col;
    const dy = this.data.targetPosition.row - this.data.position.row;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private updateTargetPosition(activeTowers: Tower[], gameEngine?: GameEngine): void {
    if (!this.data.towerTarget) return;

    let target = null;
    if (gameEngine) {
      const towerEntity = gameEngine.getTowerEntity(this.data.towerTarget);
      if (towerEntity && towerEntity.data.isAlive) {
        target = { ...towerEntity.data, type: 'tower' };
      }
    }
    
    if (!target) {
      const tower = activeTowers.find(tower => tower.id === this.data.towerTarget);
      if (tower) {
        target = { ...tower, type: 'tower' };
      }
    }
    
    if (!target && gameEngine) {
      const troopEntities = gameEngine.getAllTroops();
      const troopEntity = troopEntities.find(t => t.id === this.data.towerTarget);
      if (troopEntity && troopEntity.isAlive) {
        target = { ...troopEntity, type: 'troop' };
      }
    }
    
    if (target) {
      if (target.type === 'troop') {
        this.data.targetPosition = { 
          row: target.position?.row || 0, 
          col: target.position?.col || 0 
        };
      } else {
        this.data.targetPosition = { 
          row: target.row || 0, 
          col: target.col || 0 
        };
      }
    } else {
      console.log(`MiniPekka ${this.data.id} target ${this.data.towerTarget} disappeared, clearing target`);
      this.data.towerTarget = undefined;
    }
  }

  private findAndTargetEnemyTower(activeTowers: Tower[]): void {
    const enemyTeam = this.data.team === 'red' ? 'blue' : 'red';
    const enemyTowers = activeTowers.filter(tower => tower.team === enemyTeam && tower.active);
    
    if (enemyTowers.length === 0) {
      return;
    }

    const { position } = this.data;
    let closestTower = enemyTowers[0];
    let closestDistance = Math.sqrt(
      Math.pow(closestTower.row - position.row, 2) + 
      Math.pow(closestTower.col - position.col, 2)
    );

    for (const tower of enemyTowers) {
      const distance = Math.sqrt(
        Math.pow(tower.row - position.row, 2) + 
        Math.pow(tower.col - position.col, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTower = tower;
      }
    }

    this.data.towerTarget = closestTower.id;
    this.data.targetPosition = { row: closestTower.row, col: closestTower.col };
    this.data.state = MiniPekkaState.SEEKING_TARGET;
  }

  private attackTarget(deltaTime: number, activeTowers: Tower[], gameEngine?: GameEngine, isBlockedByFlaggedCells?: boolean): void {
    if (!this.data.towerTarget) {
      return;
    }

    let target = null;
    let targetEntity = null;
    
    if (gameEngine) {
      const towerEntity = gameEngine.getTowerEntity(this.data.towerTarget);
      if (towerEntity) {
        target = { ...towerEntity.data, type: 'tower' };
        targetEntity = towerEntity;
      }
    }
    
    if (!target) {
      const tower = activeTowers.find(tower => tower.id === this.data.towerTarget);
      if (tower) {
        target = { ...tower, type: 'tower' };
        if (gameEngine) {
          targetEntity = gameEngine.getTowerEntity(tower.id);
        }
      }
    }
    
    if (!target && gameEngine) {
      const troopEntity = gameEngine.getTroopEntity(this.data.towerTarget);
      if (troopEntity && troopEntity.data.isAlive) {
        target = { ...troopEntity.data, type: 'troop' };
        targetEntity = troopEntity;
      }
    }
    
    if (!target || (target.type === 'troop' && !target.isAlive)) {
      this.data.state = MiniPekkaState.SEEKING_TARGET;
      this.data.towerTarget = undefined;
      this.data.isInCombat = false;
      return;
    }

    // Check if target is a flying troop (MiniPekkas can't attack flying troops)
    if (target.type === 'troop' && 'flying' in target && target.flying) {
      console.log(`MiniPekka ${this.data.id} cannot attack flying troop ${this.data.towerTarget}, switching to seeking mode`);
      this.data.state = MiniPekkaState.SEEKING_TARGET;
      this.data.towerTarget = undefined;
      this.data.isInCombat = false;
      return;
    }

    const distanceToTarget = this.getDistanceToTarget();
    const attackRange = 1.2;

    if (!isBlockedByFlaggedCells && distanceToTarget > attackRange) {
      // Cible trop loin, revenir en mode poursuite (seulement si pas bloqué)
      console.log(`MiniPekka ${this.data.id} target too far (${distanceToTarget.toFixed(2)}), switching back to seeking mode`);
      this.data.state = MiniPekkaState.SEEKING_TARGET;
      this.data.isInCombat = false;
      return;
    }

    const currentTime = performance.now() / 1000;
    const timeSinceLastAttack = currentTime - this.data.lastAttackTime;
    const attackCooldown = this.data.attackSpeed;

    if (timeSinceLastAttack >= attackCooldown) {
      console.log(`MiniPekka ${this.data.id} attacks ${target.type} ${this.data.towerTarget} for ${this.data.attackDamage} damage!`);
      
      this.performAttack(target, targetEntity);
      this.data.lastAttackTime = currentTime;
    }
  }

  private performAttack(target: any, targetEntity?: any): void {
    const targetId = target.id || 'unknown';
    
    if (targetEntity && typeof targetEntity.takeDamage === 'function') {
      targetEntity.takeDamage(this.data.attackDamage);
    } else if (target && typeof target.takeDamage === 'function') {
      target.takeDamage(this.data.attackDamage);
    } else {
      console.warn(`Target ${targetId} doesn't have takeDamage method!`);
    }
  }

  public takeDamage(damage: number): void {
    if (!this.data.isAlive) return;
    
    this.data.health -= damage;
    console.log(`MiniPekka ${this.data.id} takes ${damage} damage! Health: ${this.data.health}/${this.data.maxHealth}`);
    
    if (this.data.health <= 0) {
      this.data.health = 0;
      this.data.isAlive = false;
      this.data.state = MiniPekkaState.DEAD;
      console.log(`MiniPekka ${this.data.id} has been defeated!`);
    }
  }

  public getDisplayPosition(): { x: number; y: number } {
    return {
      x: this.data.position.col,
      y: this.data.position.row
    };
  }

  private isBlockedByTargetFlaggedCells(flaggedCells: Set<string>, targetTower: any): boolean {
    if (!flaggedCells || !targetTower) return false;
    
    // Vérifier si la position actuelle du MiniPekka est une flagged cell de la tour cible
    const currentCellKey = `${Math.floor(this.data.position.row)}-${Math.floor(this.data.position.col)}`;
    
    // Si le MiniPekka est sur une flagged cell, c'est qu'il est bloqué par sa cible
    if (flaggedCells.has(currentCellKey)) {
      return true;
    }
    
    // Vérifier aussi les cellules adjacentes pour être plus tolérant
    const adjacentCells = [
      `${Math.floor(this.data.position.row - 1)}-${Math.floor(this.data.position.col)}`,
      `${Math.floor(this.data.position.row + 1)}-${Math.floor(this.data.position.col)}`,
      `${Math.floor(this.data.position.row)}-${Math.floor(this.data.position.col - 1)}`,
      `${Math.floor(this.data.position.row)}-${Math.floor(this.data.position.col + 1)}`
    ];
    
    // Si le MiniPekka est à côté d'une flagged cell, il est probablement bloqué
    return adjacentCells.some(cellKey => flaggedCells.has(cellKey));
  }
}
