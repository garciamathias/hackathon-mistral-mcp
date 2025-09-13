import { GiantEntity, Giant } from './troops/Giant';
import { BabyDragonEntity, BabyDragon } from './troops/BabyDragon';
import { BaseTroop, TroopEntity, TroopType } from './types/Troop';
import { TowerEntity, Tower } from './types/Tower';

export interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  gameTime: number;
  lastUpdateTime: number;
}

export class GameEngine {
  private troops: Map<string, TroopEntity> = new Map();
  private towers: Map<string, TowerEntity> = new Map();
  private gameState: GameState;
  private animationFrameId: number | null = null;
  private onUpdateCallback?: (troops: BaseTroop[]) => void;

  constructor() {
    this.gameState = {
      isRunning: false,
      isPaused: false,
      gameTime: 0,
      lastUpdateTime: 0
    };
  }

  public start(): void {
    if (this.gameState.isRunning) return;
    
    this.gameState.isRunning = true;
    this.gameState.isPaused = false;
    this.gameState.lastUpdateTime = performance.now();
    this.gameLoop();
  }

  public pause(): void {
    this.gameState.isPaused = true;
  }

  public resume(): void {
    if (!this.gameState.isRunning) return;
    
    this.gameState.isPaused = false;
    this.gameState.lastUpdateTime = performance.now();
    this.gameLoop();
  }

  public stop(): void {
    this.gameState.isRunning = false;
    this.gameState.isPaused = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.troops.clear();
    this.towers.clear();
  }

  // Méthodes génériques pour les troupes
  public spawnTroop(type: TroopType, team: 'red' | 'blue', row?: number, col?: number): string {
    const id = `${type}_${team}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let troop: TroopEntity;

    switch (type) {
      case TroopType.GIANT:
        troop = row !== undefined && col !== undefined 
          ? new GiantEntity(id, team, { row, col }) as unknown as TroopEntity
          : new GiantEntity(id, team) as unknown as TroopEntity;
        break;
      case TroopType.BABY_DRAGON:
        troop = row !== undefined && col !== undefined 
          ? new BabyDragonEntity(id, team, { row, col }) as unknown as TroopEntity
          : new BabyDragonEntity(id, team) as unknown as TroopEntity;
        break;
      default:
        throw new Error(`Unknown troop type: ${type}`);
    }

    this.troops.set(id, troop);
    console.log(`${type} spawned: ${id} for team ${team}${row !== undefined && col !== undefined ? ` at (${row}, ${col})` : ''}`);
    return id;
  }

  // Méthodes de compatibilité pour les anciens appels
  public spawnGiant(team: 'red' | 'blue'): string {
    return this.spawnTroop(TroopType.GIANT, team);
  }

  public spawnGiantAt(team: 'red' | 'blue', row: number, col: number): string {
    return this.spawnTroop(TroopType.GIANT, team, row, col);
  }

  public spawnBabyDragon(team: 'red' | 'blue', row: number, col: number): string {
    return this.spawnTroop(TroopType.BABY_DRAGON, team, row, col);
  }

  public removeTroop(id: string): void {
    this.troops.delete(id);
  }

  // Méthodes pour les tours
  public addTower(id: string, type: 'king' | 'princess', team: 'red' | 'blue', row: number, col: number): void {
    const tower = new TowerEntity(id, type, team, row, col);
    this.towers.set(id, tower);
    console.log(`Tower ${type} added: ${id} for team ${team} at (${row}, ${col})`);
  }

  public removeTower(id: string): void {
    this.towers.delete(id);
  }

  public getTower(id: string): Tower | undefined {
    return this.towers.get(id)?.data;
  }

  public getTowerEntity(id: string): TowerEntity | undefined {
    return this.towers.get(id);
  }

  public getAllTowers(): Tower[] {
    return Array.from(this.towers.values()).map(tower => tower.data);
  }

  public getActiveTowers(): Tower[] {
    const allTowers = this.getAllTowers();
    const activeTowers = allTowers.filter(tower => tower.active && tower.isAlive);
    console.log(`GameEngine.getActiveTowers: ${allTowers.length} total towers, ${activeTowers.length} active towers`);
    return activeTowers;
  }

  public getTroop(id: string): BaseTroop | undefined {
    return this.troops.get(id)?.data;
  }

  public getAllTroops(): BaseTroop[] {
    return Array.from(this.troops.values()).map(troop => troop.data);
  }

  public getTroopsByType(type: TroopType): BaseTroop[] {
    return this.getAllTroops().filter(troop => troop.type === type);
  }

  public getLivingTroops(): BaseTroop[] {
    return this.getAllTroops().filter(troop => troop.isAlive);
  }

  // Méthodes de compatibilité
  public getAllGiants(): Giant[] {
    return this.getTroopsByType(TroopType.GIANT) as unknown as Giant[];
  }

  public getAllBabyDragons(): BabyDragon[] {
    return this.getTroopsByType(TroopType.BABY_DRAGON) as unknown as BabyDragon[];
  }

  public getLivingGiants(): Giant[] {
    return this.getAllGiants().filter(giant => giant.isAlive);
  }

  public setOnUpdateCallback(callback: (troops: BaseTroop[]) => void): void {
    this.onUpdateCallback = callback;
  }

  private gameLoop = (): void => {
    if (!this.gameState.isRunning || this.gameState.isPaused) {
      return;
    }

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.gameState.lastUpdateTime) / 1000; // Convert to seconds
    
    this.update(deltaTime);
    
    this.gameState.lastUpdateTime = currentTime;
    this.gameState.gameTime += deltaTime;
    
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    // Nettoyer les troupes mortes
    this.cleanupDeadTroops();
    
    // Mettre à jour toutes les troupes vivantes
    const activeTowers = this.getActiveTowersInternal();
    const flaggedCells = this.getFlaggedCells();
    
    for (const troop of this.troops.values()) {
      troop.update(deltaTime, activeTowers, flaggedCells, this);
    }

    // Notifier les composants React
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.getAllTroops());
    }
  }

  private cleanupDeadTroops(): void {
    const deadTroops = Array.from(this.troops.entries())
      .filter(([, troop]) => !troop.data.isAlive)
      .map(([id, ]) => id);
    
    for (const id of deadTroops) {
      this.troops.delete(id);
    }
  }

  private getActiveTowersInternal(): Tower[] {
    return this.getActiveTowers();
  }

  private getFlaggedCells(): Set<string> {
    // Cette fonction sera connectée avec les flagged cells de l'Arena
    return new Set<string>();
  }


  public connectFlaggedCells(flaggedCells: Set<string>): void {
    // Méthode pour connecter les flagged cells depuis Arena
    this.getFlaggedCells = () => flaggedCells;
  }

  // Méthode pour trouver l'ennemi le plus proche (troupe ou tour)
  public findClosestEnemy(troop: BaseTroop): { target: any, distance: number } | null {
    const activeTowers = this.getActiveTowersInternal();
    const enemyTroops = this.getAllTroops().filter(t => 
      t.team !== troop.team && t.isAlive
    );

    let closestTarget: any = null;
    let closestDistance = Infinity;

    // Vérifier les tours ennemies
    activeTowers.forEach(tower => {
      if (tower.team !== troop.team) {
        const distance = Math.sqrt(
          Math.pow(tower.row - troop.position.row, 2) +
          Math.pow(tower.col - troop.position.col, 2)
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestTarget = { ...tower, type: 'tower' };
        }
      }
    });

    // Vérifier les troupes ennemies
    enemyTroops.forEach(enemyTroop => {
      const distance = Math.sqrt(
        Math.pow(enemyTroop.position.row - troop.position.row, 2) +
        Math.pow(enemyTroop.position.col - troop.position.col, 2)
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = { ...enemyTroop, type: 'troop' };
      }
    });

    return closestTarget ? { target: closestTarget, distance: closestDistance } : null;
  }

  // Méthodes utilitaires pour les statistiques
  public getGameStats() {
    const allTroops = this.getAllTroops();
    const livingTroops = this.getLivingTroops();
    const giants = this.getAllGiants();
    const babyDragons = this.getAllBabyDragons();
    
    return {
      totalTroops: allTroops.length,
      livingTroops: livingTroops.length,
      redTroops: allTroops.filter(t => t.team === 'red').length,
      blueTroops: allTroops.filter(t => t.team === 'blue').length,
      // Statistiques par type
      totalGiants: giants.length,
      livingGiants: giants.filter(g => g.isAlive).length,
      redGiants: giants.filter(g => g.team === 'red').length,
      blueGiants: giants.filter(g => g.team === 'blue').length,
      totalBabyDragons: babyDragons.length,
      livingBabyDragons: babyDragons.filter(d => d.isAlive).length,
      redBabyDragons: babyDragons.filter(d => d.team === 'red').length,
      blueBabyDragons: babyDragons.filter(d => d.team === 'blue').length,
      // État du jeu
      gameTime: this.gameState.gameTime,
      isRunning: this.gameState.isRunning,
      isPaused: this.gameState.isPaused
    };
  }
}

// Instance singleton du moteur de jeu
export const gameEngine = new GameEngine();
