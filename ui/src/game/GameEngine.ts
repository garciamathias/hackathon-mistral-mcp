import { GiantEntity, Giant } from './Giant';

export interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  gameTime: number;
  lastUpdateTime: number;
}

export class GameEngine {
  private giants: Map<string, GiantEntity> = new Map();
  private gameState: GameState;
  private animationFrameId: number | null = null;
  private onUpdateCallback?: (giants: Giant[]) => void;

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
    
    this.giants.clear();
  }

  public spawnGiant(team: 'red' | 'blue'): string {
    const id = `giant_${team}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const giant = new GiantEntity(id, team);
    this.giants.set(id, giant);
    
    console.log(`Giant spawned: ${id} for team ${team}`);
    return id;
  }

  public spawnGiantAt(team: 'red' | 'blue', row: number, col: number): string {
    const id = `giant_${team}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const giant = new GiantEntity(id, team, { row, col });
    this.giants.set(id, giant);
    
    console.log(`Giant spawned at (${row}, ${col}): ${id} for team ${team}`);
    return id;
  }

  public removeGiant(id: string): void {
    this.giants.delete(id);
  }

  public getGiant(id: string): Giant | undefined {
    return this.giants.get(id)?.data;
  }

  public getAllGiants(): Giant[] {
    return Array.from(this.giants.values()).map(giant => giant.data);
  }

  public getLivingGiants(): Giant[] {
    return this.getAllGiants().filter(giant => giant.isAlive);
  }

  public setOnUpdateCallback(callback: (giants: Giant[]) => void): void {
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
    // Nettoyer les géants morts
    this.cleanupDeadGiants();
    
    // Mettre à jour tous les géants vivants
    const activeTowers = this.getActiveTowers();
    const flaggedCells = this.getFlaggedCells();
    
    for (const giant of this.giants.values()) {
      giant.update(deltaTime, activeTowers, flaggedCells);
    }

    // Notifier les composants React
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.getAllGiants());
    }
  }

  private cleanupDeadGiants(): void {
    const deadGiants = Array.from(this.giants.entries())
      .filter(([_, giant]) => !giant.data.isAlive)
      .map(([id, _]) => id);
    
    for (const id of deadGiants) {
      this.giants.delete(id);
    }
  }

  private getActiveTowers(): any[] {
    // Cette fonction sera connectée avec les données des tours de l'Arena
    // Pour l'instant, retourne un tableau vide
    return [];
  }

  private getFlaggedCells(): Set<string> {
    // Cette fonction sera connectée avec les flagged cells de l'Arena
    return new Set<string>();
  }

  public connectTowers(towers: any[]): void {
    // Méthode pour connecter les données des tours depuis Arena
    this.getActiveTowers = () => towers;
  }

  public connectFlaggedCells(flaggedCells: Set<string>): void {
    // Méthode pour connecter les flagged cells depuis Arena
    this.getFlaggedCells = () => flaggedCells;
  }

  // Méthodes utilitaires pour les statistiques
  public getGameStats() {
    const giants = this.getAllGiants();
    const livingGiants = this.getLivingGiants();
    
    return {
      totalGiants: giants.length,
      livingGiants: livingGiants.length,
      redGiants: giants.filter(g => g.team === 'red').length,
      blueGiants: giants.filter(g => g.team === 'blue').length,
      gameTime: this.gameState.gameTime,
      isRunning: this.gameState.isRunning,
      isPaused: this.gameState.isPaused
    };
  }
}

// Instance singleton du moteur de jeu
export const gameEngine = new GameEngine();
