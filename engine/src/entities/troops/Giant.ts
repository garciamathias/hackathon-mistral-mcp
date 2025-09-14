import { TroopType, TroopState, Position, TroopData, TROOP_CONFIGS } from '@shared/troop';
import { TowerData } from '@shared/tower';
import { GameEngine } from '../../core/GameEngine';

export interface GiantPosition {
  row: number;
  col: number;
}


// Positions des ponts
export const BRIDGES: GiantPosition[] = [
  { row: 16, col: 3 },
  { row: 16, col: 14 }
];

export class GiantEntity {
  public data: TroopData;

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
      state: TroopState.SPAWNING,
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
      col: startPosition.col,
      spawnTime: Date.now(),
      lastUpdateTime: Date.now()
    } as TroopData;

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
    const { position } = this.data;
    
    // Calculer la distance vers chaque pont
    const distances = BRIDGES.map(bridge => {
      const dx = bridge.col - position.col;
      const dy = bridge.row - position.row;
      return Math.sqrt(dx * dx + dy * dy);
    });

    // Choisir le pont le plus proche
    const closestBridgeIndex = distances.indexOf(Math.min(...distances));
    this.data.bridgeTarget = { ...BRIDGES[closestBridgeIndex] };
    this.data.targetPosition = { ...this.data.bridgeTarget };
    this.data.state = TroopState.MOVING_TO_BRIDGE;
  }


  private startTargetingTowerDirectly(): void {
    // Aller directement vers une tour ennemie sans passer par le pont
    this.data.state = TroopState.TARGETING_TOWER;
    // La cible sera définie dans le premier update avec les tours actives
  }

    public update(deltaTime: number, activeTowers: TowerData[], flaggedCells?: Set<string>, gameEngine?: GameEngine): void {
    if (!this.data.isAlive) return;


    switch (this.data.state) {
      case TroopState.SPAWNING:
        // Giants focusOnBuildings: true - la stratégie est déjà définie dans le constructeur
        this.data.state = TroopState.TARGETING_TOWER;
        break;

      case TroopState.MOVING_TO_BRIDGE:
        this.handleMovingToBridge(deltaTime, flaggedCells);
        break;


      case TroopState.TARGETING_TOWER:
        // Si pas encore de cible définie, en trouver une
        if (!this.data.towerTarget) {
          this.findAndTargetEnemy(activeTowers);
        }
        
        if (this.data.towerTarget) {
          // Vérifier si la tour cible est toujours active
          const targetTower = activeTowers.find(tower => tower.id === this.data.towerTarget);
          if (!targetTower || !targetTower.isAlive) {
            console.log(`Giant ${this.data.id} target tower ${this.data.towerTarget} is dead or inactive, finding new target`);
            this.data.towerTarget = undefined;
            this.data.isInCombat = false;
            this.findAndTargetEnemy(activeTowers);
            break;
          }
          
          // Vérifier la distance à la tour cible AVANT de bouger
          const distanceToTower = this.getDistanceToTarget();

          if (distanceToTower <= 2.6) {
            // À portée d'attaque, passer en mode combat
            console.log(`Giant ${this.data.id} entering combat mode! Distance: ${distanceToTower.toFixed(2)}`);
            this.data.isInCombat = true;
            this.data.state = TroopState.ATTACKING_TOWER;
          } else {
            // Vérifier si le Giant est bloqué par les flagged cells de sa cible
            if (flaggedCells && this.isBlockedByTargetFlaggedCells(flaggedCells, targetTower)) {
              console.log(`Giant ${this.data.id} is blocked by target's flagged cells, entering combat mode!`);
              this.data.isInCombat = true;
              this.data.state = TroopState.ATTACKING_TOWER;
            } else {
              // Se déplacer vers la tour en vérifiant si on arrive à portée pendant le mouvement
              this.moveTowardsWithRangeCheck(this.data.targetPosition, deltaTime, flaggedCells, 2.6);
            }
          }
        }
        break;

      case TroopState.ATTACKING_TOWER:
        // Vérifier si la tour cible est toujours active avant d'attaquer
        if (this.data.towerTarget) {
          const targetTower = activeTowers.find(tower => tower.id === this.data.towerTarget);
          if (!targetTower || !targetTower.isAlive) {
            console.log(`Giant ${this.data.id} target tower ${this.data.towerTarget} is dead or inactive during attack, switching to targeting mode`);
            this.data.towerTarget = undefined;
            this.data.isInCombat = false;
            this.data.state = TroopState.TARGETING_TOWER;
            break;
          }
        }
        
        // Vérifier si le Giant est bloqué par les flagged cells
        const isBlockedByFlaggedCells = !!(flaggedCells && this.data.towerTarget && 
          this.isBlockedByTargetFlaggedCells(flaggedCells, activeTowers.find(tower => tower.id === this.data.towerTarget)));
        
        this.attackTower(deltaTime, activeTowers, gameEngine, isBlockedByFlaggedCells);
        break;
    }
  }

  private moveTowardsWithRangeCheck(target: GiantPosition, deltaTime: number, flaggedCells?: Set<string>, stopRange?: number): void {
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

    // Si on a une portée d'arrêt et qu'on est déjà dans la portée, ne pas bouger
    if (stopRange && distance <= stopRange) {
      console.log(`Giant ${this.data.id} stopping movement - in range! Distance: ${distance.toFixed(2)}`);
      this.data.isInCombat = true;
      this.data.state = GiantState.ATTACKING_TOWER;
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
      console.log(`Giant ${this.data.id} adjusting movement to stay in range`);
    }

    // Calculer la nouvelle position potentielle
    const newPosition = {
      row: position.row + normalizedDy,
      col: position.col + normalizedDx
    };

    // Vérifier si la nouvelle position entre en collision avec une flagged cell (seulement si pas volant)
    if (!this.data.flying && flaggedCells && this.wouldCollideWithFlaggedCell(newPosition, flaggedCells)) {
      console.log(`Giant ${this.data.id} (${this.data.team}) blocked by flagged cell at (${Math.floor(newPosition.row)}, ${Math.floor(newPosition.col)})`);
      
      // Analyser le contournement intelligent
      const avoidanceDirection = this.calculateSmartAvoidance(position, target, flaggedCells, Math.sqrt(normalizedDx * normalizedDx + normalizedDy * normalizedDy));
      
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
    const dx = this.data.targetPosition.col - this.data.position.col;
    const dy = this.data.targetPosition.row - this.data.position.row;
    return Math.sqrt(dx * dx + dy * dy);
  }


  private startTargetingTower(activeTowers: any[]): void {
    this.findAndTargetEnemyTower(activeTowers);
  }




  private handleMovingToBridge(deltaTime: number, flaggedCells?: Set<string>): void {
    // Vérifier si le Giant a déjà passé la frontière (pont)
    const frontierRow = 16;
    const hasCrossedFrontier = this.data.team === 'blue' ? 
      this.data.position.row < frontierRow : // Bleu va vers le haut
      this.data.position.row > frontierRow;  // Rouge va vers le bas
    
    if (hasCrossedFrontier) {
      console.log(`Giant ${this.data.id} (${this.data.team}) has crossed frontier`);
      this.data.state = TroopState.TARGETING_TOWER;
      return;
    }
    
    this.moveTowards(this.data.targetPosition, deltaTime, flaggedCells);
    
    // Vérifier si le pont est atteint
    if (this.isAtPosition(this.data.targetPosition)) {
      console.log(`Giant ${this.data.id} (${this.data.team}) reached bridge, switching to tower targeting`);
      this.data.state = TroopState.TARGETING_TOWER;
    }
  }

  private findAndTargetEnemy(activeTowers: TowerData[]): void {
    // Giants focusOnBuildings: true - ciblent toujours les tours
    this.findAndTargetEnemyTower(activeTowers);
  }

  private findAndTargetEnemyTower(activeTowers: TowerData[]): void {
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
      Math.pow(closestTower.position.row - position.row, 2) +
      Math.pow(closestTower.position.col - position.col, 2)
    );

    for (const tower of enemyTowers) {
      const distance = Math.sqrt(
        Math.pow(tower.position.row - position.row, 2) +
        Math.pow(tower.position.col - position.col, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTower = tower;
      }
    }

    // Cibler la tour la plus proche
    this.data.towerTarget = closestTower.id;
    this.data.targetPosition = { row: closestTower.position.row, col: closestTower.position.col };
    this.data.state = TroopState.TARGETING_TOWER;
  }

  public takeDamage(damage: number): void {
    if (!this.data.isAlive) return;
    
    this.data.health -= damage;
    console.log(`Giant ${this.data.id} takes ${damage} damage! Health: ${this.data.health}/${this.data.maxHealth}`);
    
    if (this.data.health <= 0) {
      this.data.health = 0;
      this.data.isAlive = false;
      this.data.state = TroopState.DEAD;
      console.log(`Giant ${this.data.id} has been defeated!`);
    }
  }

  public getDisplayPosition(): { x: number; y: number } {
    // Convertir la position en coordonnées d'affichage
    return {
      x: this.data.position.col,
      y: this.data.position.row
    };
  }

  private attackTower(_deltaTime: number, activeTowers: TowerData[], gameEngine?: GameEngine, isBlockedByFlaggedCells?: boolean): void {
    if (!this.data.towerTarget) {
      console.log(`Giant ${this.data.id} has no tower target in combat mode!`);
      return;
    }

    // Trouver la tour cible dans le GameEngine
    let targetTower = null;
    if (gameEngine) {
      targetTower = gameEngine.getTowerEntity(this.data.towerTarget);
    }
    
    // Fallback vers activeTowers si pas trouvé dans GameEngine
    if (!targetTower) {
      targetTower = activeTowers.find(tower => tower.id === this.data.towerTarget);
    }
    
    if (!targetTower) {
      console.log(`Giant ${this.data.id} target tower ${this.data.towerTarget} not found!`);
      // Retourner en mode recherche de tour
      this.data.state = TroopState.TARGETING_TOWER;
      this.data.towerTarget = undefined;
      return;
    }

    // Vérifier si la tour est toujours à portée (sauf si bloqué par flagged cells)
    const distanceToTower = this.getDistanceToTarget();
    const attackRange = 2.6;

    if (!isBlockedByFlaggedCells && distanceToTower > attackRange) {
      // Cible trop loin, revenir en mode poursuite (seulement si pas bloqué)
      console.log(`Giant ${this.data.id} target too far (${distanceToTower.toFixed(2)}), switching back to targeting mode`);
      this.data.state = TroopState.TARGETING_TOWER;
      this.data.isInCombat = false;
      return;
    }

    // Vérifier si on peut attaquer (cooldown)
    const currentTime = performance.now() / 1000; // Convertir en secondes
    const timeSinceLastAttack = currentTime - this.data.lastAttackTime;
    const attackCooldown = this.data.attackSpeed; // Temps entre les attaques (en secondes)

    if (timeSinceLastAttack >= attackCooldown) {
      // Effectuer l'attaque
      console.log(`Giant ${this.data.id} attacks tower ${this.data.towerTarget} for ${this.data.attackDamage} damage! Distance: ${distanceToTower.toFixed(2)}`);
      
      // Ici, nous devrions infliger des dégâts à la tour
      // Pour l'instant, on simule juste l'attaque
      this.performAttack(targetTower, gameEngine);
      
      this.data.lastAttackTime = currentTime;
    }
  }

  private performAttack(targetTower: any, gameEngine?: GameEngine): void {
    console.log(`Attack performed: Giant ${this.data.id} -> Tower ${targetTower.id}`);

    if (gameEngine && targetTower.id) {
      gameEngine.dealDamageToTower(targetTower.id, this.data.attackDamage);
    }
  }

  private isBlockedByTargetFlaggedCells(flaggedCells: Set<string>, targetTower: TowerData): boolean {
    if (!flaggedCells || !targetTower) return false;
    
    // Vérifier si la position actuelle du Giant est une flagged cell de la tour cible
    const currentCellKey = `${Math.floor(this.data.position.row)}-${Math.floor(this.data.position.col)}`;
    
    // Si le Giant est sur une flagged cell, c'est qu'il est bloqué par sa cible
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
    
    // Si le Giant est à côté d'une flagged cell, il est probablement bloqué
    return adjacentCells.some(cellKey => flaggedCells.has(cellKey));
  }
}
