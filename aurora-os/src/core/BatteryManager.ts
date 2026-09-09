import { eventBus } from './EventBus';

class BatteryManager {
  private level: number = 85;
  private charging: boolean = false;
  private drainRate: number = 0.1;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start(): void {
    this.intervalId = setInterval(() => {
      if (!this.charging) {
        this.level = Math.max(0, this.level - this.drainRate);
      } else {
        this.level = Math.min(100, this.level + 0.3);
      }
      eventBus.emit('battery:changed', { level: Math.round(this.level), charging: this.charging });
    }, 3000);
  }

  stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  getLevel(): number {
    return Math.round(this.level);
  }

  isCharging(): boolean {
    return this.charging;
  }

  setCharging(value: boolean): void {
    this.charging = value;
    eventBus.emit('battery:charging', value);
  }

  setDrainRate(rate: number): void {
    this.drainRate = rate;
  }

  addDrain(amount: number): void {
    this.level = Math.max(0, this.level - amount);
    eventBus.emit('battery:changed', { level: Math.round(this.level), charging: this.charging });
  }

  getColor(): string {
    if (this.level > 60) return 'var(--color-success)';
    if (this.level > 20) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }
}

export const batteryManager = new BatteryManager();
