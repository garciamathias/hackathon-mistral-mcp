import { SERVER_CONFIG } from '@config/constants';

export type TickCallback = (deltaTime: number, currentTick: number) => void;

export class TickManager {
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: Set<TickCallback> = new Set();
  private currentTick: number = 0;
  private lastTickTime: number = 0;
  private isRunning: boolean = false;
  private tickRate: number;
  private tickInterval: number;

  constructor(tickRate: number = SERVER_CONFIG.TICK_RATE) {
    this.tickRate = tickRate;
    this.tickInterval = 1000 / tickRate; // Convert Hz to ms
  }

  public start(): void {
    if (this.isRunning) {
      console.warn('TickManager is already running');
      return;
    }

    this.isRunning = true;
    this.lastTickTime = Date.now();
    this.currentTick = 0;

    this.intervalId = setInterval(() => {
      this.tick();
    }, this.tickInterval);

    console.log(`TickManager started at ${this.tickRate}Hz (${this.tickInterval}ms interval)`);
  }

  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.currentTick = 0;
    console.log('TickManager stopped');
  }

  public pause(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('TickManager paused');
  }

  public resume(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastTickTime = Date.now();

    this.intervalId = setInterval(() => {
      this.tick();
    }, this.tickInterval);

    console.log('TickManager resumed');
  }

  public addCallback(callback: TickCallback): void {
    this.callbacks.add(callback);
  }

  public removeCallback(callback: TickCallback): void {
    this.callbacks.delete(callback);
  }

  public getCurrentTick(): number {
    return this.currentTick;
  }

  public getTickRate(): number {
    return this.tickRate;
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  private tick(): void {
    const now = Date.now();
    const deltaTime = now - this.lastTickTime;
    this.lastTickTime = now;
    this.currentTick++;

    // Execute all registered callbacks
    for (const callback of this.callbacks) {
      try {
        callback(deltaTime, this.currentTick);
      } catch (error) {
        console.error('Error in tick callback:', error);
      }
    }
  }

  public destroy(): void {
    this.stop();
    this.callbacks.clear();
  }
}