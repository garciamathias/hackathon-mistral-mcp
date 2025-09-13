export enum GiantState {
  SPAWNING,
  MOVING_TO_BRIDGE,
  TARGETING_TOWER,
  ATTACKING_TOWER,
  DEAD
}

export interface GiantPosition {
  row: number;
  col: number;
}

import { TroopType, TROOP_CONFIGS, TroopState, BaseTroop } from '../types/Troop';
import { TroopUtils } from '../utils/troop_utils';

export interface Giant {
  id: string;
  type: TroopType.GIANT;
  team: 'red' | 'blue';
  position: GiantPosition;
  targetPosition: GiantPosition;
  state: GiantState;
  health: number;
  maxHealth: number;
  speed: number; // cellules par seconde
  isAlive: boolean;
  bridgeTarget?: GiantPosition;
  towerTarget?: string; // ID de la tour ciblée
  isInCombat: boolean;
  attackDamage: number;
  attackSpeed: number; // attaques par seconde
  lastAttackTime: number;
  flying: boolean;
  focusOnBuildings: boolean;
}

// Positions des ponts
export const BRIDGES: GiantPosition[] = [
  { row: 16, col: 3 },
  { row: 16, col: 14 }
];

export class GiantEntity {
  public data: Giant;

  constructor(id: string, team: 'red' | 'blue', customPosition?: GiantPosition) {
    const defaultPosition = { row: 0, col: 0 };
    const startPosition = customPosition || defaultPosition;
    const config = TROOP_CONFIGS[TroopType.GIANT];

    this.data = {
      id,
      type: TroopType.GIANT,
      team,
      position: { ...startPosition },
      targetPosition: { ...startPosition },
      state: GiantState.SPAWNING,
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
      focusOnBuildings: config.focusOnBuildings
    };

    // Déterminer la stratégie de mouvement
    this.chooseMovementStrategy();
  }

  private chooseMovementStrategy(): void {
    const { position, team } = this.data;
    const frontierRow = 16; // Ligne frontière (ponts)
    
    console.log(`Giant ${team} spawned at (${position.row}, ${position.col}), frontier: ${frontierRow}`);
    
    // Déterminer si le Giant a besoin du pont
    let needsBridge = false;
    
    if (team === 'blue') {
      // Les bleus visent les tours rouges (en haut)
      // Besoin du pont si spawn sous la frontière (row > 16)
      needsBridge = position.row > frontierRow;
    } else if (team === 'red') {
      // Les rouges visent les tours bleues (en bas)
      // Besoin du pont si spawn au-dessus de la frontière (row < 16)
      needsBridge = position.row < frontierRow;
    }
    
    console.log(`Giant ${team} needs bridge: ${needsBridge}`);
    
    if (needsBridge) {
      // Aller au pont le plus proche
      console.log('Going to bridge');
      this.chooseBridge();
    } else {
      // Aller directement vers une tour ennemie
      console.log('Going directly to tower');
      this.startTargetingTowerDirectly();
    }
  }

  private chooseBridge(): void {
    const closestBridge = TroopUtils.chooseBridge(this.getBaseTroopData());
    this.data.bridgeTarget = { ...closestBridge };
    this.data.targetPosition = { ...this.data.bridgeTarget };
    this.data.state = GiantState.MOVING_TO_BRIDGE;
  }

  private getBaseTroopData(): BaseTroop {
    return {
      ...this.data,
      state: this.mapGiantStateToTroopState(this.data.state)
    } as BaseTroop;
  }

  private mapGiantStateToTroopState(giantState: GiantState): TroopState {
    switch (giantState) {
      case GiantState.SPAWNING:
        return TroopState.SPAWNING;
      case GiantState.MOVING_TO_BRIDGE:
        return TroopState.MOVING_TO_BRIDGE;
      case GiantState.TARGETING_TOWER:
        return TroopState.TARGETING_TOWER;
      case GiantState.ATTACKING_TOWER:
        return TroopState.ATTACKING_TOWER;
      case GiantState.DEAD:
        return TroopState.DEAD;
      default:
        return TroopState.SPAWNING;
    }
  }

  private startTargetingTowerDirectly(): void {
    // Aller directement vers une tour ennemie sans passer par le pont
    this.data.state = GiantState.TARGETING_TOWER;
    // La cible sera définie dans le premier update avec les tours actives
  }

    public update(deltaTime: number, activeTowers: any[], flaggedCells?: Set<string>, gameEngine?: any): void {
    if (!this.data.isAlive) return;


    switch (this.data.state) {
      case GiantState.SPAWNING:
        // Giants focusOnBuildings: true - la stratégie est déjà définie dans le constructeur
        this.data.state = GiantState.TARGETING_TOWER;
        break;

      case GiantState.MOVING_TO_BRIDGE:
        this.handleMovingToBridge(deltaTime, flaggedCells, gameEngine);
        break;


      case GiantState.TARGETING_TOWER:
        // Si pas encore de cible définie, en trouver une
        if (!this.data.towerTarget) {
          this.findAndTargetEnemy(activeTowers, gameEngine);
        }
        
        if (this.data.towerTarget) {
          // Vérifier la distance à la tour cible
          const distanceToTower = this.getDistanceToTarget();

          if (distanceToTower <= (this.data.team === 'red' ? 2.9 : 2.4)) {
            // À moins d'une case de la tour, passer en mode combat
            console.log(`Giant ${this.data.id} entering combat mode! Distance: ${distanceToTower.toFixed(2)}`);
            this.data.isInCombat = true;
            this.data.state = GiantState.ATTACKING_TOWER;
          } else {
            // Continuer à se déplacer vers la tour
            this.moveTowards(this.data.targetPosition, deltaTime, flaggedCells);
          }
        }
        break;

      case GiantState.ATTACKING_TOWER:
        this.attackTower(deltaTime, activeTowers);
        break;
    }
  }

  private moveTowards(target: GiantPosition, deltaTime: number, flaggedCells?: Set<string>): void {
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
      console.log(`Giant ${this.data.id} (${this.data.team}) blocked by flagged cell at (${Math.floor(newPosition.row)}, ${Math.floor(newPosition.col)})`);
      
      // Analyser le contournement intelligent
      const avoidanceDirection = this.calculateSmartAvoidance(position, target, flaggedCells, moveDistance);
      
      if (avoidanceDirection) {
        normalizedDx = avoidanceDirection.dx;
        normalizedDy = avoidanceDirection.dy;
      } else {
        // Si on ne peut pas contourner, ne pas bouger
        console.log(`Giant ${this.data.id} (${this.data.team}) cannot avoid obstacle, staying put`);
        return;
      }
    }

    // Mettre à jour la position
    this.data.position.col += normalizedDx;
    this.data.position.row += normalizedDy;
  }

  private wouldCollideWithFlaggedCell(position: GiantPosition, flaggedCells: Set<string>): boolean {
    const cellKey = `${Math.floor(position.row)}-${Math.floor(position.col)}`;
    return flaggedCells.has(cellKey);
  }

  private calculateSmartAvoidance(position: GiantPosition, target: GiantPosition, flaggedCells: Set<string>, moveDistance: number): {dx: number, dy: number} | null {
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

  private findObstacleCenter(position: GiantPosition, flaggedCells: Set<string>): GiantPosition | null {
    // Chercher les cellules flaggées autour de notre position
    const nearbyFlaggedCells: GiantPosition[] = [];
    
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

  private isAtPosition(target: GiantPosition): boolean {
    const dx = this.data.position.col - target.col;
    const dy = this.data.position.row - target.row;
    return Math.sqrt(dx * dx + dy * dy) < 0.5; // Augmenté de 0.2 à 0.5
  }

  private getDistanceToTarget(): number {
    return TroopUtils.getDistanceToTarget(this.getBaseTroopData());
  }


  private startTargetingTower(activeTowers: any[]): void {
    this.findAndTargetEnemyTower(activeTowers);
  }


  private mapTroopStateToGiantState(troopState: TroopState): GiantState {
    switch (troopState) {
      case TroopState.SPAWNING:
        return GiantState.SPAWNING;
      case TroopState.MOVING_TO_BRIDGE:
        return GiantState.MOVING_TO_BRIDGE;
      case TroopState.TARGETING_TOWER:
        return GiantState.TARGETING_TOWER;
      case TroopState.ATTACKING_TOWER:
        return GiantState.ATTACKING_TOWER;
      case TroopState.DEAD:
        return GiantState.DEAD;
      default:
        return GiantState.SPAWNING;
    }
  }


  private handleMovingToBridge(deltaTime: number, flaggedCells?: Set<string>, gameEngine?: any): void {
    const newState = TroopUtils.handleMovingToBridge(
      this.getBaseTroopData(),
      deltaTime,
      flaggedCells,
      gameEngine,
      (target, deltaTime, flaggedCells) => this.moveTowards(target, deltaTime, flaggedCells),
      (target) => this.isAtPosition(target)
    );
    this.data.state = this.mapTroopStateToGiantState(newState);
  }

  private findAndTargetEnemy(activeTowers: any[], gameEngine?: any): void {
    // Giants focusOnBuildings: true - ciblent toujours les tours
    this.findAndTargetEnemyTower(activeTowers);
  }

  private findAndTargetEnemyTower(activeTowers: any[]): void {
    console.log(`Giant ${this.data.id} (${this.data.team}) findAndTargetEnemyTower called with towers:`, activeTowers);
    
    // Déterminer l'équipe ennemie
    const enemyTeam = this.data.team === 'red' ? 'blue' : 'red';
    console.log(`Giant ${this.data.id} (${this.data.team}) looking for enemy team: ${enemyTeam}`);
    
    // Filtrer les tours ennemies actives
    const enemyTowers = activeTowers.filter(tower => tower.team === enemyTeam && tower.active);
    console.log(`Giant ${this.data.id} (${this.data.team}) enemy towers found:`, enemyTowers.map(t => `${t.id}(${t.team})`));
    
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
    this.data.state = GiantState.TARGETING_TOWER;
  }

  public takeDamage(damage: number): void {
    this.data.health -= damage;
    if (this.data.health <= 0) {
      this.data.health = 0;
      this.data.isAlive = false;
      this.data.state = GiantState.DEAD;
    }
  }

  public getDisplayPosition(): { x: number; y: number } {
    // Convertir la position en coordonnées d'affichage
    return {
      x: this.data.position.col,
      y: this.data.position.row
    };
  }

  private attackTower(deltaTime: number, activeTowers: any[]): void {
    if (!this.data.towerTarget) {
      console.log(`Giant ${this.data.id} has no tower target in combat mode!`);
      return;
    }

    // Trouver la tour cible
    const targetTower = activeTowers.find(tower => tower.id === this.data.towerTarget);
    if (!targetTower) {
      console.log(`Giant ${this.data.id} target tower ${this.data.towerTarget} not found!`);
      // Retourner en mode recherche de tour
      this.data.state = GiantState.TARGETING_TOWER;
      this.data.towerTarget = undefined;
      return;
    }

    // Vérifier si la tour est toujours à portée
    const distanceToTower = this.getDistanceToTarget();

    // Vérifier si on peut attaquer (cooldown)
    const currentTime = performance.now() / 1000; // Convertir en secondes
    const timeSinceLastAttack = currentTime - this.data.lastAttackTime;
    const attackCooldown = 1.0 / this.data.attackSpeed; // Temps entre les attaques

    if (timeSinceLastAttack >= attackCooldown) {
      // Effectuer l'attaque
      console.log(`Giant ${this.data.id} attacks tower ${this.data.towerTarget} for ${this.data.attackDamage} damage! Distance: ${distanceToTower.toFixed(2)}`);
      
      // Ici, nous devrions infliger des dégâts à la tour
      // Pour l'instant, on simule juste l'attaque
      this.performAttack(targetTower);
      
      this.data.lastAttackTime = currentTime;
    }
  }

  private performAttack(targetTower: any): void {
    // Cette méthode sera appelée pour effectuer l'attaque réelle
    // Pour l'instant, on log juste l'attaque
    console.log(`Attack performed: Giant ${this.data.id} -> Tower ${targetTower.id}`);
    
    // TODO: Implémenter la logique de dégâts sur la tour
    // targetTower.takeDamage(this.data.attackDamage);
  }
}
