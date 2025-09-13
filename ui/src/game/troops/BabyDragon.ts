export enum BabyDragonState {
  SPAWNING = TroopState.SPAWNING,
  SEEKING_TARGET = TroopState.TARGETING_TOWER,
  ATTACKING_TARGET = TroopState.ATTACKING_TOWER,
  DEAD = TroopState.DEAD
}


export interface BabyDragonPosition {
  row: number;
  col: number;
}

import { TroopType, TROOP_CONFIGS, TroopState, BaseTroop } from '../types/Troop';
import { Tower } from '../types/Tower';
import { GameEngine } from '../GameEngine';

export interface BabyDragon {
  id: string;
  type: TroopType.BABY_DRAGON;
  team: 'red' | 'blue';
  position: BabyDragonPosition;
  targetPosition: BabyDragonPosition;
  state: BabyDragonState;
  health: number;
  maxHealth: number;
  speed: number; // cellules par seconde
  isAlive: boolean;
  bridgeTarget?: BabyDragonPosition;
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
export const BRIDGES: BabyDragonPosition[] = [
  { row: 16, col: 3 },
  { row: 16, col: 14 }
];

export class BabyDragonEntity {
  public data: BabyDragon;

  constructor(id: string, team: 'red' | 'blue', customPosition?: BabyDragonPosition) {
    const defaultPosition = { row: 0, col: 0 };
    const startPosition = customPosition || defaultPosition;
    const config = TROOP_CONFIGS[TroopType.BABY_DRAGON];

    this.data = {
      id,
      type: TroopType.BABY_DRAGON,
      team,
      position: { ...startPosition },
      targetPosition: { ...startPosition },
      state: BabyDragonState.SPAWNING,
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

    // Déterminer la stratégie de mouvement
    this.chooseMovementStrategy();
  }

  private chooseMovementStrategy(): void {
    console.log(`BabyDragon ${this.data.team} spawned at (${this.data.position.row}, ${this.data.position.col}) - going directly to closest enemy`);
    this.startTargetingTowerDirectly();
  }


  private startTargetingTowerDirectly(): void {
    // Aller directement chercher l'ennemi le plus proche
    this.data.state = BabyDragonState.SEEKING_TARGET;
    // La cible sera définie dans le premier update
  }

    public update(deltaTime: number, activeTowers: Tower[], flaggedCells?: Set<string>, gameEngine?: GameEngine): void {
    if (!this.data.isAlive) return;

    switch (this.data.state) {
      case BabyDragonState.SPAWNING:
        // BabyDragons vont directement chercher l'ennemi le plus proche
        this.data.state = BabyDragonState.SEEKING_TARGET;
        break;

      case BabyDragonState.SEEKING_TARGET:
        // Si pas encore de cible définie, en trouver une
        if (!this.data.towerTarget) {
          this.findAndTargetEnemy(activeTowers, gameEngine);
        }
        
        // Mettre à jour la position de la cible actuelle (importante pour les cibles mobiles)
        if (this.data.towerTarget && gameEngine) {
          this.updateTargetPosition(activeTowers, gameEngine);
        }
        
        // Recalculer la cible la plus proche seulement si pas en combat (focusOnBuildings: false)
        if (!this.data.isInCombat && gameEngine) {
          const closestEnemyResult = gameEngine.findClosestEnemy(this.data as unknown as BaseTroop);
          if (closestEnemyResult && this.data.towerTarget !== closestEnemyResult.target.id) {
            const currentDistance = this.getDistanceToTarget();
            // Ne changer de cible que si la nouvelle cible est significativement plus proche
            if (closestEnemyResult.distance < currentDistance - 1.0) {
              console.log(`BabyDragon ${this.data.id} retargeting from ${this.data.towerTarget} to closer enemy ${closestEnemyResult.target.id}`);
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
          // Vérifier la distance à la tour cible AVANT de bouger
          const distanceToTower = this.getDistanceToTarget();
          
          if (distanceToTower <= 2.6) {
            // À portée d'attaque, passer en mode combat
            console.log(`BabyDragon ${this.data.id} entering combat mode! Distance: ${distanceToTower.toFixed(2)}`);
            this.data.isInCombat = true;
            this.data.state = BabyDragonState.ATTACKING_TARGET;
          } else {
            // Se déplacer vers la cible en vérifiant si on arrive à portée pendant le mouvement
            this.moveTowardsWithRangeCheck(this.data.targetPosition, deltaTime, flaggedCells, 2.6);
          }
        }
        break;

      case BabyDragonState.ATTACKING_TARGET:
        // Mettre à jour la position de la cible même en combat (pour les cibles mobiles)
        if (this.data.towerTarget && gameEngine) {
          this.updateTargetPosition(activeTowers, gameEngine);
        }
        this.attackTower(deltaTime, activeTowers, gameEngine);
        break;
    }
  }

  private moveTowardsWithRangeCheck(target: BabyDragonPosition, deltaTime: number, flaggedCells?: Set<string>, stopRange?: number): void {
    const { position, speed } = this.data;

    console.log(`BabyDragon ${this.data.id} moving towards target: ${target.row}, ${target.col}`);
    
    // Calculer la direction
    const dx = target.col - position.col;
    const dy = target.row - position.row;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.1) {
      // Arrivé à destination
      this.data.position = { ...target };
      return;
    }

    // Si on a une portée d'arrêt et qu'on est déjà dans la portée, ne pas bouger
    if (stopRange && distance <= stopRange) {
      console.log(`BabyDragon ${this.data.id} stopping movement - in range! Distance: ${distance.toFixed(2)}`);
      this.data.isInCombat = true;
      this.data.state = BabyDragonState.ATTACKING_TARGET;
      return;
    }

    // Normaliser et appliquer la vitesse
    const moveDistance = speed * deltaTime;
    let normalizedDx = (dx / distance) * moveDistance;
    let normalizedDy = (dy / distance) * moveDistance;

    // Si on a une portée d'arrêt, vérifier qu'on ne va pas la dépasser
    if (stopRange && moveDistance >= distance - stopRange) {
      // Ajuster le mouvement pour s'arrêter à la bonne distance
      const targetDistance = Math.max(stopRange - 0.1, 0.1);
      const adjustedMoveDistance = distance - targetDistance;
      normalizedDx = (dx / distance) * adjustedMoveDistance;
      normalizedDy = (dy / distance) * adjustedMoveDistance;
      console.log(`BabyDragon ${this.data.id} adjusting movement to stay in range`);
    }

    // Calculer la nouvelle position potentielle
    const newPosition = {
      row: position.row + normalizedDy,
      col: position.col + normalizedDx
    };

    // Vérifier si la nouvelle position entre en collision avec une flagged cell (seulement si pas volant)
    if (!this.data.flying && flaggedCells && this.wouldCollideWithFlaggedCell(newPosition, flaggedCells)) {
      console.log(`BabyDragon ${this.data.id} (${this.data.team}) blocked by flagged cell at (${Math.floor(newPosition.row)}, ${Math.floor(newPosition.col)})`);
      
      // Analyser le contournement intelligent
      const avoidanceDirection = this.calculateSmartAvoidance(position, target, flaggedCells, Math.sqrt(normalizedDx * normalizedDx + normalizedDy * normalizedDy));
      
      if (avoidanceDirection) {
        normalizedDx = avoidanceDirection.dx;
        normalizedDy = avoidanceDirection.dy;
      } else {
        // Si on ne peut pas contourner, ne pas bouger
        console.log(`BabyDragon ${this.data.id} (${this.data.team}) cannot avoid obstacle, staying put`);
        return;
      }
    }

    // Mettre à jour la position
    this.data.position.col += normalizedDx;
    this.data.position.row += normalizedDy;
  }

  private moveTowards(target: BabyDragonPosition, deltaTime: number, flaggedCells?: Set<string>): void {
    const { position, speed } = this.data;
    
    // Calculer la direction
    const dx = target.col - position.col;
    const dy = target.row - position.row;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.1) {
      // Arrivé à destination
      this.data.position = { ...target };
      return;
    }

    // Normaliser et appliquer la vitesse
    const moveDistance = speed * deltaTime;
    let normalizedDx = (dx / distance) * moveDistance;
    let normalizedDy = (dy / distance) * moveDistance;

    // Calculer la nouvelle position potentielle
    const newPosition = {
      row: position.row + normalizedDy,
      col: position.col + normalizedDx
    };

    // Vérifier si la nouvelle position entre en collision avec une flagged cell (seulement si pas volant)
    if (!this.data.flying && flaggedCells && this.wouldCollideWithFlaggedCell(newPosition, flaggedCells)) {
      console.log(`BabyDragon ${this.data.id} (${this.data.team}) blocked by flagged cell at (${Math.floor(newPosition.row)}, ${Math.floor(newPosition.col)})`);
      
      // Analyser le contournement intelligent
      const avoidanceDirection = this.calculateSmartAvoidance(position, target, flaggedCells, moveDistance);
      
      if (avoidanceDirection) {
        normalizedDx = avoidanceDirection.dx;
        normalizedDy = avoidanceDirection.dy;
      } else {
        // Si on ne peut pas contourner, ne pas bouger
        console.log(`BabyDragon ${this.data.id} (${this.data.team}) cannot avoid obstacle, staying put`);
        return;
      }
    }

    // Mettre à jour la position
    this.data.position.col += normalizedDx;
    this.data.position.row += normalizedDy;
  }

  private wouldCollideWithFlaggedCell(position: BabyDragonPosition, flaggedCells: Set<string>): boolean {
    const cellKey = `${Math.floor(position.row)}-${Math.floor(position.col)}`;
    return flaggedCells.has(cellKey);
  }

  private calculateSmartAvoidance(position: BabyDragonPosition, target: BabyDragonPosition, flaggedCells: Set<string>, moveDistance: number): {dx: number, dy: number} | null {
    // Trouver le centre de l'obstacle qui nous bloque
    const obstacleCenter = this.findObstacleCenter(position, flaggedCells);
    
    if (!obstacleCenter) return null;

    // Déterminer de quel côté de l'obstacle on se trouve
    const isRightOfObstacle = position.col > obstacleCenter.col;
    const isLeftOfObstacle = position.col < obstacleCenter.col;
    const isAboveObstacle = position.row < obstacleCenter.row;
    const isBelowObstacle = position.row > obstacleCenter.row;

    // Choisir la direction de contournement selon notre position relative
    let avoidanceDx = 0;
    let avoidanceDy = 0;

    // Si on va principalement vers le haut/bas
    if (Math.abs(target.row - position.row) > Math.abs(target.col - position.col)) {
      // Mouvement vertical principal
      if (isRightOfObstacle) {
        // On est à droite de l'obstacle, contourner par la droite
        avoidanceDx = moveDistance;
      } else if (isLeftOfObstacle) {
        // On est à gauche de l'obstacle, contourner par la gauche
        avoidanceDx = -moveDistance;
      }
    } else {
      // Mouvement horizontal principal
      if (isAboveObstacle) {
        // On est au-dessus de l'obstacle, contourner par le haut
        avoidanceDy = -moveDistance;
      } else if (isBelowObstacle) {
        // On est en-dessous de l'obstacle, contourner par le bas
        avoidanceDy = moveDistance;
      }
    }

    // Vérifier que la direction d'évitement est libre
    const avoidancePosition = {
      row: position.row + avoidanceDy,
      col: position.col + avoidanceDx
    };

    if (!this.wouldCollideWithFlaggedCell(avoidancePosition, flaggedCells)) {
      return { dx: avoidanceDx, dy: avoidanceDy };
    }

    // Si le premier choix est bloqué, essayer l'autre côté
    avoidanceDx = -avoidanceDx;
    avoidanceDy = -avoidanceDy;

    const alternativePosition = {
      row: position.row + avoidanceDy,
      col: position.col + avoidanceDx
    };

    if (!this.wouldCollideWithFlaggedCell(alternativePosition, flaggedCells)) {
      return { dx: avoidanceDx, dy: avoidanceDy };
    }

    return null; // Aucun contournement possible
  }

  private findObstacleCenter(position: BabyDragonPosition, flaggedCells: Set<string>): BabyDragonPosition | null {
    // Chercher les cellules flaggées autour de notre position
    const nearbyFlaggedCells: BabyDragonPosition[] = [];
    
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

    // Calculer le centre de l'obstacle
    const avgRow = nearbyFlaggedCells.reduce((sum, cell) => sum + cell.row, 0) / nearbyFlaggedCells.length;
    const avgCol = nearbyFlaggedCells.reduce((sum, cell) => sum + cell.col, 0) / nearbyFlaggedCells.length;

    return { row: avgRow, col: avgCol };
  }

  private getDistanceToTarget(): number {
    const dx = this.data.targetPosition.col - this.data.position.col;
    const dy = this.data.targetPosition.row - this.data.position.row;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private updateTargetPosition(activeTowers: Tower[], gameEngine?: GameEngine): void {
    if (!this.data.towerTarget) return;

    // Chercher d'abord dans les tours du GameEngine
    let target = null;
    if (gameEngine) {
      const towerEntity = gameEngine.getTowerEntity(this.data.towerTarget);
      if (towerEntity) {
        target = { ...towerEntity.data, type: 'tower' };
      }
    }
    
    // Fallback vers activeTowers si pas trouvé dans GameEngine
    if (!target) {
      const tower = activeTowers.find(tower => tower.id === this.data.towerTarget);
      if (tower) {
        target = { ...tower, type: 'tower' };
      }
    }
    
    // Si pas trouvé dans les tours, chercher dans les troupes
    if (!target && gameEngine) {
      const troopEntities = gameEngine.getAllTroops();
      const troopEntity = troopEntities.find(t => t.id === this.data.towerTarget);
      if (troopEntity && troopEntity.isAlive) {
        target = { ...troopEntity, type: 'troop' };
      }
    }
    
    if (target) {
      // Mettre à jour la position de la cible
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
      // Cible disparue, la supprimer
      console.log(`BabyDragon ${this.data.id} target ${this.data.towerTarget} disappeared, clearing target`);
      this.data.towerTarget = undefined;
    }
  }

  private findAndTargetEnemy(activeTowers: Tower[], gameEngine?: GameEngine): void {
    // BabyDragons ciblent toujours le plus proche (focusOnBuildings: false)
    if (gameEngine) {
      const closestEnemyResult = gameEngine.findClosestEnemy(this.data as unknown as BaseTroop);
      if (closestEnemyResult) {
        const { target } = closestEnemyResult;
        this.data.towerTarget = target.id;
        if (target.type === 'tower') {
          this.data.targetPosition = { 
            row: target.row || 0, 
            col: target.col || 0 
          };
        } else {
          this.data.targetPosition = { 
            row: target.position?.row || 0, 
            col: target.position?.col || 0 
          };
        }
        console.log(`BabyDragon ${this.data.id} targeting closest enemy ${target.type} ${target.id}`);
      }
    } else {
      // Fallback vers la logique originale si gameEngine n'est pas disponible
      this.findAndTargetEnemyTower(activeTowers);
    }
  }

  private findAndTargetEnemyTower(activeTowers: Tower[]): void {
    console.log(`BabyDragon ${this.data.id} (${this.data.team}) findAndTargetEnemyTower called with towers:`, activeTowers);
    
    // Déterminer l'équipe ennemie
    const enemyTeam = this.data.team === 'red' ? 'blue' : 'red';
    console.log(`BabyDragon ${this.data.id} (${this.data.team}) looking for enemy team: ${enemyTeam}`);
    
    // Filtrer les tours ennemies actives
    const enemyTowers = activeTowers.filter(tower => tower.team === enemyTeam && tower.active);
    console.log(`BabyDragon ${this.data.id} (${this.data.team}) enemy towers found:`, enemyTowers.map(t => `${t.id}(${t.team})`));
    
    if (enemyTowers.length === 0) {
      // Pas de tour ennemie, continuer tout droit
      console.log('No enemy towers found, continuing straight');
      return;
    }

    // Trouver la tour la plus proche
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

    // Cibler la tour la plus proche
    this.data.towerTarget = closestTower.id;
    this.data.targetPosition = { row: closestTower.row, col: closestTower.col };
    this.data.state = BabyDragonState.SEEKING_TARGET;
  }

  public takeDamage(damage: number): void {
    if (!this.data.isAlive) return;
    
    this.data.health -= damage;
    console.log(`BabyDragon ${this.data.id} takes ${damage} damage! Health: ${this.data.health}/${this.data.maxHealth}`);
    
    if (this.data.health <= 0) {
      this.data.health = 0;
      this.data.isAlive = false;
      this.data.state = BabyDragonState.DEAD;
      console.log(`BabyDragon ${this.data.id} has been defeated!`);
    }
  }

  public getDisplayPosition(): { x: number; y: number } {
    // Convertir la position en coordonnées d'affichage
    return {
      x: this.data.position.col,
      y: this.data.position.row
    };
  }

  private attackTower(deltaTime: number, activeTowers: Tower[], gameEngine?: GameEngine): void {
    if (!this.data.towerTarget) {
      console.log(`BabyDragon ${this.data.id} has no target in combat mode!`);
      return;
    }

    // Trouver la cible (peut être une tour ou une troupe)
    let target = null;
    
    // D'abord chercher dans les tours du GameEngine
    if (gameEngine) {
      const towerEntity = gameEngine.getTowerEntity(this.data.towerTarget);
      if (towerEntity) {
        target = { ...towerEntity.data, type: 'tower' };
      }
    }
    
    // Si pas trouvé dans les tours du GameEngine, chercher dans activeTowers
    if (!target) {
      const tower = activeTowers.find(tower => tower.id === this.data.towerTarget);
      if (tower) {
        target = { ...tower, type: 'tower' };
      }
    }
    
    // Si pas trouvé dans les tours, chercher dans les troupes du GameEngine
    if (!target && gameEngine) {
      const troopEntities = gameEngine.getAllTroops();
      const troopEntity = troopEntities.find(t => t.id === this.data.towerTarget);
      if (troopEntity) {
        target = { ...troopEntity, type: 'troop' };
      }
    }
    
    if (!target || (target.type === 'troop' && !target.isAlive)) {
      console.log(`BabyDragon ${this.data.id} target ${this.data.towerTarget} not found or dead!`);
      // Retourner en mode recherche de cible
      this.data.state = BabyDragonState.SEEKING_TARGET;
      this.data.towerTarget = undefined;
      this.data.isInCombat = false;
      return;
    }

    // La position de la cible est déjà mise à jour par updateTargetPosition()

    // Vérifier si la cible est toujours à portée
    const distanceToTarget = this.getDistanceToTarget();
    const attackRange = 2.6;

    if (distanceToTarget > attackRange) {
      // Cible trop loin, revenir en mode poursuite
      console.log(`BabyDragon ${this.data.id} target too far (${distanceToTarget.toFixed(2)}), switching back to seeking mode`);
      this.data.state = BabyDragonState.SEEKING_TARGET;
      this.data.isInCombat = false;
      return;
    }

    // Vérifier si on peut attaquer (cooldown)
    const currentTime = performance.now() / 1000; // Convertir en secondes
    const timeSinceLastAttack = currentTime - this.data.lastAttackTime;
    const attackCooldown = 1.0 / this.data.attackSpeed; // Temps entre les attaques

    if (timeSinceLastAttack >= attackCooldown) {
      // Effectuer l'attaque
      console.log(`BabyDragon ${this.data.id} attacks ${target.type} ${this.data.towerTarget} for ${this.data.attackDamage} damage! Distance: ${distanceToTarget.toFixed(2)}`);
      
      // Ici, nous devrions infliger des dégâts à la cible
      // Pour l'instant, on simule juste l'attaque
      this.performAttack(target);
      
      this.data.lastAttackTime = currentTime;
    }
  }

  private performAttack(target: { id?: string; data?: { id?: string; takeDamage?: (damage: number) => void }; takeDamage?: (damage: number) => void; type?: string }): void {
    // Infliger des dégâts à la cible (tour ou troupe)
    const targetType = 'type' in target ? target.type : 'troop';
    const targetId = 'id' in target ? target.id : (target.data ? target.data.id : 'unknown');
    console.log(`Attack performed: BabyDragon ${this.data.id} -> ${targetType} ${targetId}`);
    
    // Si c'est une entité du GameEngine, utiliser sa méthode takeDamage
    if ('takeDamage' in target && typeof target.takeDamage === 'function') {
      target.takeDamage(this.data.attackDamage);
    } else if (target.data && 'takeDamage' in target.data && typeof target.data.takeDamage === 'function') {
      // Si c'est une entité avec data.takeDamage
      target.data.takeDamage(this.data.attackDamage);
    } else {
      console.warn(`Target ${targetId} doesn't have takeDamage method! Type: ${typeof target}, Keys: ${Object.keys(target)}`);
    }
  }
}
