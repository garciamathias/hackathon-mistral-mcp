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
      return troop.position.row >= frontierRow; // Bleu commence en bas (row >= 16)
    } else {
      return troop.position.row <= frontierRow; // Rouge commence en haut (row <= 16)
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
        // Flying + non focusOnBuildings : utiliser la logique avec rayon de détection
        console.log(`${troop.type} ${troop.id} is flying and not focused on buildings - using radius detection logic`);
        return TroopUtils.handleNonFocusTransition(troop, activeTowers, gameEngine, true);
      } else {
        // Non flying + non focusOnBuildings : logique avec rayon de détection
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
    return TroopUtils.handleNonFocusTransition(troop, activeTowers, gameEngine, false);
  }

  /**
   * Logique commune pour les troupes qui ne focusent pas les bâtiments (volantes et non-volantes)
   */
  static handleNonFocusTransition<T extends BaseTroop>(
    troop: T, 
    activeTowers: Tower[], 
    gameEngine?: SimpleGameEngine,
    isFlying: boolean = false
  ): TroopState {
    const detectionRadius = 7;
    const isOnOwnSide = TroopUtils.isOnOwnSide(troop);
    
    if (gameEngine) {
      const closestEnemyResult = gameEngine.findClosestEnemy(troop);
      
      if (closestEnemyResult) {
        const enemy = closestEnemyResult.target;
        let enemyPosition: Position;
        
        if (enemy.type === 'tower') {
          enemyPosition = { row: enemy.row || 0, col: enemy.col || 0 };
        } else {
          enemyPosition = enemy.position || { row: 0, col: 0 };
        }
        
        // Pour les non-volantes, vérifier si l'ennemi est du même côté
        let isEnemyTargetable = true;
        if (!isFlying) {
          const isEnemyOnSameSide = TroopUtils.isPositionOnSameSide(enemyPosition, troop.team);
          isEnemyTargetable = isEnemyOnSameSide;
        }
        
        // Si l'ennemi est dans le rayon de détection ET ciblable
        if (closestEnemyResult.distance <= detectionRadius && isEnemyTargetable) {
          console.log(`${troop.type} ${troop.id} - enemy within radius ${detectionRadius} and targetable, going for enemy`);
          return TroopState.TARGETING_TOWER;
        } else {
          // Ennemi trop loin ou pas ciblable, aller vers les tours
          console.log(`${troop.type} ${troop.id} - no enemy within radius ${detectionRadius} or not targetable, targeting towers`);
          return TroopUtils.handleTowerTargeting(troop, isOnOwnSide, isFlying);
        }
      } else {
        // Pas d'ennemi trouvé du tout, aller vers les tours
        console.log(`${troop.type} ${troop.id} - no enemy found, targeting towers`);
        return TroopUtils.handleTowerTargeting(troop, isOnOwnSide, isFlying);
      }
    } else {
      // Pas de gameEngine, aller vers les tours
      return TroopUtils.handleTowerTargeting(troop, isOnOwnSide, isFlying);
    }
  }

  /**
   * Gère le ciblage des tours selon la position et le type de troupe
   */
  static handleTowerTargeting<T extends BaseTroop>(
    troop: T,
    isOnOwnSide: boolean,
    isFlying: boolean
  ): TroopState {
    if (isOnOwnSide && !isFlying) {
      // Non-volante sur son côté : doit aller au pont pour atteindre les tours ennemies
      console.log(`${troop.type} ${troop.id} - on own side, must go to bridge to reach enemy towers`);
      return TroopState.MOVING_TO_BRIDGE;
    } else {
      // Volante ou déjà du côté adverse : aller directement vers les tours
      console.log(`${troop.type} ${troop.id} - targeting enemy towers directly`);
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
        // Mais seulement si on est encore sur notre côté (pas encore passé le pont)
        if (isEnemyOnSameSide && closestEnemyResult.distance < distanceToBridge * 0.3 && TroopUtils.isOnOwnSide(troop)) {
          console.log(`${troop.type} ${troop.id} - intercepting very close enemy on same side while going to bridge`);
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
   * Trouve et cible un ennemi selon les propriétés de la troupe avec rayon de détection
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
      // Nouvelle logique avec rayon de détection
      const detectionRadius = 7;
      
      if (gameEngine && setTarget) {
        const closestEnemyResult = gameEngine.findClosestEnemy(troop);
        if (closestEnemyResult) {
          const { target } = closestEnemyResult;
          const targetPosition = { 
            row: target.type === 'tower' ? (target.row || 0) : (target.position?.row || 0), 
            col: target.type === 'tower' ? (target.col || 0) : (target.position?.col || 0) 
          };
          
          // Pour les non-volantes, vérifier si l'ennemi est du même côté
          let isEnemyTargetable = true;
          if (!troop.flying) {
            const isEnemyOnSameSide = TroopUtils.isPositionOnSameSide(targetPosition, troop.team);
            isEnemyTargetable = isEnemyOnSameSide;
          }
          
          // Si l'ennemi est dans le rayon de détection ET ciblable
          if (closestEnemyResult.distance <= detectionRadius && isEnemyTargetable) {
            setTarget(target.id, targetPosition);
            console.log(`${troop.type} ${troop.id} targeting enemy ${target.type} ${target.id} within radius ${detectionRadius} at (${targetPosition.row}, ${targetPosition.col})`);
          } else {
            // Ennemi trop loin ou pas ciblable, cibler les tours
            console.log(`${troop.type} ${troop.id} - enemy too far (${closestEnemyResult.distance.toFixed(2)}) or not targetable, targeting towers instead`);
            if (findAndTargetEnemyTowerCallback) {
              findAndTargetEnemyTowerCallback(activeTowers);
            }
          }
        } else {
          // Pas d'ennemi trouvé, cibler les tours
          console.log(`${troop.type} ${troop.id} - no enemy found, targeting towers`);
          if (findAndTargetEnemyTowerCallback) {
            findAndTargetEnemyTowerCallback(activeTowers);
          }
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
