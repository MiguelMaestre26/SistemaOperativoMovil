import { eventBus } from './EventBus';

class MemoryManager {
  private totalMemory: number = 4096;
  private usedMemory: number = 1200;
  private threshold: number = 0.85;

  getTotal(): number {
    return this.totalMemory;
  }

  getUsed(): number {
    return this.usedMemory;
  }

  getFree(): number {
    return this.totalMemory - this.usedMemory;
  }

  getUsagePercent(): number {
    return (this.usedMemory / this.totalMemory) * 100;
  }

  allocate(amount: number): boolean {
    if (this.usedMemory + amount > this.totalMemory * this.threshold) {
      eventBus.emit('memory:warning', this.getUsagePercent());
      return false;
    }
    this.usedMemory += amount;
    eventBus.emit('memory:changed', { used: this.usedMemory, total: this.totalMemory });
    return true;
  }

  free(amount: number): void {
    this.usedMemory = Math.max(0, this.usedMemory - amount);
    eventBus.emit('memory:changed', { used: this.usedMemory, total: this.totalMemory });
  }

  isLowMemory(): boolean {
    return this.getUsagePercent() > this.threshold * 100;
  }
}

export const memoryManager = new MemoryManager();
