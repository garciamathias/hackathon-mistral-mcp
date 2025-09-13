export enum GiantState {
  SPAWNING,
  MOVING_TO_BRIDGE,
  CROSSING_BRIDGE,
  TARGETING_TOWER,
  ATTACKING_TOWER,
  DEAD
}

export interface GiantPosition {
  row: number;
  col: number;
}

export interface Giant {
  id: string;
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
}

// Positions des ponts
export const BRIDGES: GiantPosition[] = [
  { row: 16, col: 3 },
  { row: 16, col: 14 }
];

// Zones de spawn
export const SPAWN_ZONES = {
  red: [
    { row: 32, col: 8 },
    { row: 32, col: 9 },
    { row: 33, col: 8 },
    { row: 33, col: 9 }
  ],
  blue: [
    { row: 0, col: 8 },
    { row: 0, col: 9 },
    { row: 1, col: 8 },
    { row: 1, col: 9 }
  ]
};

export class GiantEntity {
  public data: Giant;

  constructor(id: string, team: 'red' | 'blue', customPosition?: GiantPosition) {
    // Position de spawn : personnalisée ou aléatoire dans la zone de l'équipe
    const spawnPosition = customPosition || (() => {
      const spawnZone = SPAWN_ZONES[team];
      return spawnZone[Math.floor(Math.random() * spawnZone.length)];
    })();

    this.data = {
      id,
      team,
      position: { ...spawnPosition },
      targetPosition: { ...spawnPosition },
      state: GiantState.SPAWNING,
      health: 100,
      maxHealth: 100,
      speed: 1.5, // 1.5 cellules par seconde
      isAlive: true,
      bridgeTarget: undefined,
      towerTarget: undefined
    };

    // Déterminer le pont le plus proche
    this.chooseBridge();
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
    this.data.state = GiantState.MOVING_TO_BRIDGE;
  }

  public update(deltaTime: number, activeTowers: any[], flaggedCells?: Set<string>): void {
    if (!this.data.isAlive) return;

    switch (this.data.state) {
      case GiantState.SPAWNING:
        // Transition automatique vers le mouvement
        this.data.state = GiantState.MOVING_TO_BRIDGE;
        break;

      case GiantState.MOVING_TO_BRIDGE:
        this.moveTowards(this.data.targetPosition, deltaTime, flaggedCells);
        
        // Vérifier si le pont est atteint
        if (this.isAtPosition(this.data.targetPosition)) {
          this.startCrossingBridge();
        }
        break;

      case GiantState.CROSSING_BRIDGE:
        this.moveTowards(this.data.targetPosition, deltaTime, flaggedCells);
        
        // Vérifier si la traversée est terminée
        if (this.isAtPosition(this.data.targetPosition)) {
          this.startTargetingTower(activeTowers);
        }
        break;

      case GiantState.TARGETING_TOWER:
        this.moveTowards(this.data.targetPosition, deltaTime, flaggedCells);
        
        // Vérifier si la tour est atteinte
        if (this.isAtPosition(this.data.targetPosition)) {
          this.data.state = GiantState.ATTACKING_TOWER;
        }
        break;

      case GiantState.ATTACKING_TOWER:
        // Logique d'attaque à implémenter
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

    // Vérifier si la nouvelle position entre en collision avec une flagged cell
    if (flaggedCells && this.wouldCollideWithFlaggedCell(newPosition, flaggedCells)) {
      // Essayer de contourner en allant perpendiculairement
      const perpDx = -normalizedDy; // Perpendiculaire à la direction
      const perpDy = normalizedDx;
      
      // Essayer de contourner par la droite
      let avoidancePosition = {
        row: position.row + perpDy,
        col: position.col + perpDx
      };
      
      if (this.wouldCollideWithFlaggedCell(avoidancePosition, flaggedCells)) {
        // Essayer de contourner par la gauche
        avoidancePosition = {
          row: position.row - perpDy,
          col: position.col - perpDx
        };
      }
      
      // Si on peut contourner, utiliser cette direction
      if (!this.wouldCollideWithFlaggedCell(avoidancePosition, flaggedCells)) {
        normalizedDx = perpDx;
        normalizedDy = perpDy;
      } else {
        // Si on ne peut pas contourner, ne pas bouger
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

  private isAtPosition(target: GiantPosition): boolean {
    const dx = this.data.position.col - target.col;
    const dy = this.data.position.row - target.row;
    return Math.sqrt(dx * dx + dy * dy) < 0.2;
  }

  private startCrossingBridge(): void {
    const { team, bridgeTarget } = this.data;
    
    if (!bridgeTarget) return;

    // Définir la destination après le pont (côté ennemi)
    if (team === 'red') {
      // Équipe rouge va vers le haut (côté bleu)
      this.data.targetPosition = { row: 10, col: bridgeTarget.col };
    } else {
      // Équipe bleue va vers le bas (côté rouge)
      this.data.targetPosition = { row: 22, col: bridgeTarget.col };
    }
    
    this.data.state = GiantState.CROSSING_BRIDGE;
  }

  private startTargetingTower(activeTowers: any[]): void {
    // Filtrer les tours ennemies actives
    const enemyTowers = activeTowers.filter(tower => tower.team !== this.data.team && tower.active);
    
    if (enemyTowers.length === 0) {
      // Pas de tour ennemie, continuer tout droit
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
}
