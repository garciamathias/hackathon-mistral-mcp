import { BaseTroop, Position, TroopState, BRIDGES, TargetResult } from '../types/Troop';
import { Tower } from '../types/Tower';

interface SimpleGameEngine {
  findClosestEnemy(troop: BaseTroop): TargetResult | null;
}

export class TroopUtils {
  /**
   * Détermine si une troupe est sur son propre côté de la carte
   */
  static isOnOwnSide(troop: BaseTroop): boolean {
    const frontierRow = 16;
    if (troop.team === 'blue') {
      return troop.position.row <= frontierRow; // Bleu commence en bas
    } else {
      return troop.position.row >= frontierRow; // Rouge commence en haut
    }
  }

  /**
   * Calcule la distance jusqu'au pont le plus proche
   */
  static getDistanceToBridge(troop: BaseTroop): number {
    const bridges = BRIDGES;
    let closestBridgeDistance = Infinity;
    
    bridges.forEach(bridge => {
      const distance = Math.sqrt(
        Math.pow(bridge.row - troop.position.row, 2) +
        Math.pow(bridge.col - troop.position.col, 2)
      );
      if (distance < closestBridgeDistance) {
        closestBridgeDistance = distance;
      }
    });
    
    return closestBridgeDistance;
  }

  /**
   * Calcule la distance jusqu'à la position cible actuelle de la troupe
   */
  static getDistanceToTarget(troop: BaseTroop): number {
    return Math.sqrt(
      Math.pow(troop.targetPosition.row - troop.position.row, 2) +
      Math.pow(troop.targetPosition.col - troop.position.col, 2)
    );
  }

  /**
   * Choisit le pont le plus proche pour une troupe
   */
  static chooseBridge(troop: BaseTroop): Position {
    const bridges = BRIDGES;
    let closestBridge = bridges[0];
    let closestDistance = TroopUtils.getDistanceToPosition(troop.position, bridges[0]);

    for (let i = 1; i < bridges.length; i++) {
      const distance = TroopUtils.getDistanceToPosition(troop.position, bridges[i]);
      if (distance < closestDistance) {
        closestBridge = bridges[i];
        closestDistance = distance;
      }
    }

    return closestBridge;
  }

  /**
   * Calcule la distance entre deux positions
   */
  static getDistanceToPosition(from: Position, to: Position): number {
    return Math.sqrt(
      Math.pow(to.row - from.row, 2) +
      Math.pow(to.col - from.col, 2)
    );
  }

  /**
   * Vérifie si une troupe a déjà traversé la frontière
   */
  static hasCrossedFrontier(troop: BaseTroop): boolean {
    const frontierRow = 16;
    return troop.team === 'blue' ? 
      troop.position.row < frontierRow : // Bleu va vers le haut
      troop.position.row > frontierRow;  // Rouge va vers le bas
  }

  /**
   * Gère la transition depuis l'état SPAWNING selon les propriétés de la troupe
   */
  static handleSpawningTransition<T extends BaseTroop>(
    troop: T, 
    activeTowers: Tower[], 
    gameEngine?: SimpleGameEngine
  ): TroopState {
    console.log(`${troop.type} ${troop.id} (${troop.team}) handling spawning transition - flying: ${troop.flying}, focusOnBuildings: ${troop.focusOnBuildings}`);
    
    if (!troop.focusOnBuildings) {
      // Logique pour les troupes qui ne se concentrent pas sur les bâtiments
      if (troop.flying) {
        // Flying + non focusOnBuildings : aller directement vers l'ennemi le plus proche
        console.log(`${troop.type} ${troop.id} is flying and not focused on buildings - going directly to closest enemy`);
        return TroopState.TARGETING_TOWER;
      } else {
        // Non flying + non focusOnBuildings : logique complexe basée sur la position
        return TroopUtils.handleNonFlyingNonFocusTransition(troop, activeTowers, gameEngine);
      }
    } else {
      // Logique originale pour les troupes qui se concentrent sur les bâtiments
      return TroopUtils.handleFocusOnBuildingsTransition(troop);
    }
  }

  /**
   * Gère la transition pour les troupes non-volantes qui ne se concentrent pas sur les bâtiments
   */
  static handleNonFlyingNonFocusTransition<T extends BaseTroop>(
    troop: T, 
    activeTowers: Tower[], 
    gameEngine?: SimpleGameEngine
  ): TroopState {
    const isOnOwnSide = TroopUtils.isOnOwnSide(troop);
    
    if (isOnOwnSide) {
      // Sur son propre côté : vérifier si l'ennemi le plus proche est du même côté ou de l'autre côté
      if (gameEngine) {
        const closestEnemyResult = gameEngine.findClosestEnemy(troop);
        const distanceToBridge = TroopUtils.getDistanceToBridge(troop);
        
        if (closestEnemyResult) {
          const enemy = closestEnemyResult.target;
          let enemyPosition: Position;
          
          if (enemy.type === 'tower') {
            enemyPosition = { row: enemy.row || 0, col: enemy.col || 0 };
          } else {
            enemyPosition = enemy.position || { row: 0, col: 0 };
          }
          
          const isEnemyOnSameSide = TroopUtils.isPositionOnSameSide(enemyPosition, troop.team);
          
          if (isEnemyOnSameSide && closestEnemyResult.distance < distanceToBridge) {
            // L'ennemi est sur le même côté et plus proche que le pont, aller directement vers lui
            console.log(`${troop.type} ${troop.id} - enemy on same side and closer than bridge, targeting enemy directly`);
            return TroopState.TARGETING_TOWER;
          } else {
            // L'ennemi est de l'autre côté ou le pont est plus proche, aller au pont d'abord
            console.log(`${troop.type} ${troop.id} - enemy on opposite side or bridge closer, going to bridge first`);
            return TroopState.MOVING_TO_BRIDGE;
          }
        } else {
          // Pas d'ennemi trouvé, aller au pont
          console.log(`${troop.type} ${troop.id} - no enemy found, going to bridge`);
          return TroopState.MOVING_TO_BRIDGE;
        }
      } else {
        // Fallback vers le pont si gameEngine n'est pas disponible
        return TroopState.MOVING_TO_BRIDGE;
      }
    } else {
      // Sur le côté adverse : aller vers l'ennemi le plus proche (troupe ou tour)
      console.log(`${troop.type} ${troop.id} - on opponent side, targeting closest enemy`);
      return TroopState.TARGETING_TOWER;
    }
  }

  /**
   * Vérifie si une position est du même côté que l'équipe donnée
   */
  static isPositionOnSameSide(position: Position, team: 'red' | 'blue'): boolean {
    const frontierRow = 16;
    if (team === 'blue') {
      return position.row >= frontierRow; // Bleu commence en bas
    } else {
      return position.row <= frontierRow; // Rouge commence en haut
    }
  }

  /**
   * Gère la transition pour les troupes qui se concentrent sur les bâtiments (logique originale)
   */
  static handleFocusOnBuildingsTransition<T extends BaseTroop>(troop: T): TroopState {
    // Logique originale : vérifier si déjà de l'autre côté, sinon aller au pont
    const hasCrossedFrontier = TroopUtils.hasCrossedFrontier(troop);

    if (hasCrossedFrontier) {
      console.log(`${troop.type} ${troop.id} (${troop.team}) has already crossed frontier at spawn, switching to tower targeting`);
      return TroopState.TARGETING_TOWER;
    } else {
      console.log(`${troop.type} ${troop.id} (${troop.team}) transitioning from SPAWNING to MOVING_TO_BRIDGE`);
      return TroopState.MOVING_TO_BRIDGE;
    }
  }

  /**
   * Gère la logique de mouvement vers le pont
   */
  static handleMovingToBridge<T extends BaseTroop>(
    troop: T,
    deltaTime: number,
    flaggedCells?: Set<string>,
    gameEngine?: SimpleGameEngine,
    moveTowardsCallback?: (target: Position, deltaTime: number, flaggedCells?: Set<string>) => void,
    isAtPositionCallback?: (target: Position) => boolean
  ): TroopState {
    // Vérifier si la troupe a déjà passé la frontière (pont)
    const hasCrossedFrontier = TroopUtils.hasCrossedFrontier(troop);
    
    if (hasCrossedFrontier) {
      console.log(`${troop.type} ${troop.id} (${troop.team}) has crossed frontier`);
      
      if (!troop.focusOnBuildings) {
        // Pour les troupes non-focusOnBuildings, maintenant du côté adverse, cibler l'ennemi le plus proche
        console.log(`${troop.type} ${troop.id} - crossed to opponent side, now targeting closest enemy`);
      }
      
      return TroopState.TARGETING_TOWER;
    }
    
    // Pour les troupes non-focusOnBuildings, vérifier s'il y a un ennemi proche sur le même côté
    if (!troop.focusOnBuildings && gameEngine) {
      const closestEnemyResult = gameEngine.findClosestEnemy(troop);
      if (closestEnemyResult) {
        const enemy = closestEnemyResult.target;
        let enemyPosition: Position;
        
        if (enemy.type === 'tower') {
          enemyPosition = { row: enemy.row || 0, col: enemy.col || 0 };
        } else {
          enemyPosition = enemy.position || { row: 0, col: 0 };
        }
        
        const isEnemyOnSameSide = TroopUtils.isPositionOnSameSide(enemyPosition, troop.team);
        const distanceToBridge = TroopUtils.getDistanceToTarget(troop);
        
        // Si l'ennemi est sur le même côté et beaucoup plus proche que le pont, l'intercepter
        if (isEnemyOnSameSide && closestEnemyResult.distance < distanceToBridge * 0.5) {
          console.log(`${troop.type} ${troop.id} - intercepting close enemy on same side while going to bridge`);
          return TroopState.TARGETING_TOWER;
        }
      }
    }
    
    if (moveTowardsCallback) {
      moveTowardsCallback(troop.targetPosition, deltaTime, flaggedCells);
    }
    
    // Vérifier si le pont est atteint
    if (isAtPositionCallback && isAtPositionCallback(troop.targetPosition)) {
      console.log(`${troop.type} ${troop.id} (${troop.team}) reached bridge, switching to tower targeting`);
      return TroopState.TARGETING_TOWER;
    }

    return TroopState.MOVING_TO_BRIDGE; // Continuer à se déplacer
  }

  /**
   * Trouve et cible un ennemi selon les propriétés de la troupe
   */
  static findAndTargetEnemy<T extends BaseTroop>(
    troop: T,
    activeTowers: Tower[],
    gameEngine?: SimpleGameEngine,
    setTarget?: (targetId: string, targetPosition: Position) => void,
    findAndTargetEnemyTowerCallback?: (activeTowers: Tower[]) => void
  ): void {
    if (troop.focusOnBuildings) {
      // Logique originale : cibler uniquement les tours
      if (findAndTargetEnemyTowerCallback) {
        findAndTargetEnemyTowerCallback(activeTowers);
      }
    } else {
      // Nouvelle logique : cibler le plus proche (troupe ou tour)
      if (gameEngine && setTarget) {
        const closestEnemyResult = gameEngine.findClosestEnemy(troop);
        if (closestEnemyResult) {
          const { target } = closestEnemyResult;
          const targetPosition = { 
            row: target.type === 'tower' ? (target.row || 0) : (target.position?.row || 0), 
            col: target.type === 'tower' ? (target.col || 0) : (target.position?.col || 0) 
          };
          setTarget(target.id, targetPosition);
          console.log(`${troop.type} ${troop.id} targeting closest enemy ${target.type} ${target.id} at (${targetPosition.row}, ${targetPosition.col})`);
        }
      } else {
        // Fallback vers la logique originale si gameEngine n'est pas disponible
        if (findAndTargetEnemyTowerCallback) {
          findAndTargetEnemyTowerCallback(activeTowers);
        }
      }
    }
  }
}
