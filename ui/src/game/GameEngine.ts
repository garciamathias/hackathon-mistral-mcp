import { GiantEntity, Giant } from './troops/Giant';
import { BabyDragonEntity, BabyDragon } from './troops/BabyDragon';
import { MiniPekkaEntity, MiniPekka } from './troops/MiniPekka';
import { ValkyrieEntity, Valkyrie } from './troops/Valkyrie';
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
  private onGameEndCallback?: (winner: 'red' | 'blue') => void;

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

  public reset(): void {
    this.stop();
    this.gameState.gameTime = 0;
    this.gameState.lastUpdateTime = 0;
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
      case TroopType.MINI_PEKKA:
        troop = row !== undefined && col !== undefined 
          ? new MiniPekkaEntity(id, team, { row, col }) as unknown as TroopEntity
          : new MiniPekkaEntity(id, team) as unknown as TroopEntity;
        break;
      case TroopType.VALKYRIE:
        troop = row !== undefined && col !== undefined 
          ? new ValkyrieEntity(id, team, { row, col }) as unknown as TroopEntity
          : new ValkyrieEntity(id, team) as unknown as TroopEntity;
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

  public spawnMiniPekka(team: 'red' | 'blue', row: number, col: number): string {
    return this.spawnTroop(TroopType.MINI_PEKKA, team, row, col);
  }

  public spawnValkyrie(team: 'red' | 'blue', row: number, col: number): string {
    return this.spawnTroop(TroopType.VALKYRIE, team, row, col);
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
    return activeTowers;
  }

  public getTroop(id: string): BaseTroop | undefined {
    return this.troops.get(id)?.data;
  }

  public getAllTroops(): BaseTroop[] {
    return Array.from(this.troops.values()).map(troop => troop.data);
  }

  public getTroopEntity(id: string): TroopEntity | undefined {
    return this.troops.get(id);
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

  public getAllMiniPekkas(): MiniPekka[] {
    return this.getTroopsByType(TroopType.MINI_PEKKA) as unknown as MiniPekka[];
  }

  public getAllValkyries(): Valkyrie[] {
    return this.getTroopsByType(TroopType.VALKYRIE) as unknown as Valkyrie[];
  }

  public getLivingGiants(): Giant[] {
    return this.getAllGiants().filter(giant => giant.isAlive);
  }

  public getLivingBabyDragons(): BabyDragon[] {
    return this.getAllBabyDragons().filter(dragon => dragon.isAlive);
  }

  public getLivingMiniPekkas(): MiniPekka[] {
    return this.getAllMiniPekkas().filter(pekka => pekka.isAlive);
  }

  public getLivingValkyries(): Valkyrie[] {
    return this.getAllValkyries().filter(valkyrie => valkyrie.isAlive);
  }

  public setOnUpdateCallback(callback: (troops: BaseTroop[]) => void): void {
    this.onUpdateCallback = callback;
  }

  public setOnGameEndCallback(callback: (winner: 'red' | 'blue') => void): void {
    this.onGameEndCallback = callback;
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
    
    // Utiliser setTimeout pour l'environnement serveur, requestAnimationFrame pour le client
    if (typeof window !== 'undefined') {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    } else {
      // Environnement serveur - utiliser setTimeout
      setTimeout(() => {
        this.gameLoop();
      }, 16); // ~60 FPS
    }
  };

  protected update(deltaTime: number): void {
    // Nettoyer les troupes mortes
    this.cleanupDeadTroops();
    
    // Mettre à jour toutes les troupes vivantes
    const activeTowers = this.getActiveTowersInternal();
    const flaggedCells = this.getFlaggedCells();
    
    for (const troop of this.troops.values()) {
      troop.update(deltaTime, activeTowers, flaggedCells, this);
    }

    // Mettre à jour les tours (attaque des ennemis)
    this.updateTowers(deltaTime);

    // Vérifier la fin de partie
    this.checkGameEnd();

    // Notifier les composants React
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.getAllTroops());
    }
  }

  protected updateTowers(deltaTime: number): void {
    const allTroops = this.getAllTroops();
    const allTowers = this.getActiveTowersInternal();

    for (const tower of this.towers.values()) {
      // Mettre à jour le statut canAttack pour les tours du roi
      tower.updateCanAttackStatus(allTowers);
      
      // Mettre à jour la tour (recherche de cibles et attaque)
      tower.update(deltaTime, allTroops, allTowers, this);
    }
  }

  protected cleanupDeadTroops(): void {
    const deadTroops = Array.from(this.troops.entries())
      .filter(([, troop]) => {
        // Add safety check for data property
        if (!troop || !troop.data) {
          console.warn('Troop missing data property:', troop);
          return false;
        }
        return !troop.data.isAlive;
      })
      .map(([id, ]) => id);

    for (const id of deadTroops) {
      this.troops.delete(id);
    }
  }

  private checkGameEnd(): void {
    // Vérifier si une King Tower est détruite
    const kingRed = this.towers.get('king_red');
    const kingBlue = this.towers.get('king_blue');

    // Add safety checks for tower data
    if (kingRed && kingRed.data && !kingRed.data.isAlive) {
      // King Rouge détruite → Bleu gagne
      console.log('Game Over: Blue team wins! King Red destroyed');
      this.endGame('blue');
    } else if (kingBlue && kingBlue.data && !kingBlue.data.isAlive) {
      // King Bleue détruite → Rouge gagne
      console.log('Game Over: Red team wins! King Blue destroyed');
      this.endGame('red');
    }
  }

  private endGame(winner: 'red' | 'blue'): void {
    this.gameState.isRunning = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Notifier la fin de partie
    if (this.onGameEndCallback) {
      this.onGameEndCallback(winner);
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

    // Vérifier les tours ennemies (toujours accessibles)
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

    // Vérifier les troupes ennemies (avec restriction flying vs non-flying et côté de la rivière)
    enemyTroops.forEach(enemyTroop => {
      // Non-flying troops cannot target flying troops
      if (!troop.flying && enemyTroop.flying) {
        return; // Skip flying troops for non-flying attackers
      }
      
      // Pour les troupes non-volantes, vérifier qu'elles sont du même côté de la rivière
      if (!troop.flying) {
        const frontierRow = 16;
        const troopSide = troop.position.row <= frontierRow ? 'top' : 'bottom';
        const enemySide = enemyTroop.position.row <= frontierRow ? 'top' : 'bottom';
        
        if (troopSide !== enemySide) {
          return; // Skip enemies on opposite side of river for non-flying troops
        }
      }
      
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
    const miniPekkas = this.getAllMiniPekkas();
    const valkyries = this.getAllValkyries();
    
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
      totalMiniPekkas: miniPekkas.length,
      livingMiniPekkas: miniPekkas.filter(p => p.isAlive).length,
      redMiniPekkas: miniPekkas.filter(p => p.team === 'red').length,
      blueMiniPekkas: miniPekkas.filter(p => p.team === 'blue').length,
      totalValkyries: valkyries.length,
      livingValkyries: valkyries.filter(v => v.isAlive).length,
      redValkyries: valkyries.filter(v => v.team === 'red').length,
      blueValkyries: valkyries.filter(v => v.team === 'blue').length,
      // État du jeu
      gameTime: this.gameState.gameTime,
      isRunning: this.gameState.isRunning,
      isPaused: this.gameState.isPaused
    };
  }
}

// Instance singleton du moteur de jeu
export const gameEngine = new GameEngine();
