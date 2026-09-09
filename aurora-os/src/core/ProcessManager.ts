import { eventBus } from './EventBus';

export interface ProcessInfo {
  pid: string;
  name: string;
  memoryMB: number;
  cpuPercent: number;
  status: 'running' | 'paused' | 'terminated';
  priority: number;
  startedAt: number;
}

class ProcessManager {
  private processes: Map<string, ProcessInfo> = new Map();
  private maxProcesses = 12;

  launch(pid: string, name: string, memoryMB: number, priority: number = 5): ProcessInfo {
    const process: ProcessInfo = {
      pid,
      name,
      memoryMB,
      cpuPercent: Math.random() * 30 + 5,
      status: 'running',
      priority,
      startedAt: Date.now(),
    };
    this.processes.set(pid, process);
    eventBus.emit('process:launched', process);
    return process;
  }

  pause(pid: string): void {
    const p = this.processes.get(pid);
    if (p) {
      p.status = 'paused';
      p.cpuPercent = 0;
      eventBus.emit('process:paused', p);
    }
  }

  resume(pid: string): void {
    const p = this.processes.get(pid);
    if (p) {
      p.status = 'running';
      p.cpuPercent = Math.random() * 30 + 5;
      eventBus.emit('process:resumed', p);
    }
  }

  terminate(pid: string): void {
    const p = this.processes.get(pid);
    if (p) {
      p.status = 'terminated';
      this.processes.delete(pid);
      eventBus.emit('process:terminated', p);
    }
  }

  killOldest(): ProcessInfo | null {
    let oldest: ProcessInfo | null = null;
    for (const p of this.processes.values()) {
      if (p.status === 'paused') {
        if (!oldest || p.startedAt < oldest.startedAt) {
          oldest = p;
        }
      }
    }
    if (oldest) {
      this.terminate(oldest.pid);
    }
    return oldest;
  }

  getActiveProcesses(): ProcessInfo[] {
    return Array.from(this.processes.values()).filter(p => p.status !== 'terminated');
  }

  getAllProcesses(): ProcessInfo[] {
    return Array.from(this.processes.values());
  }

  getTotalMemory(): number {
    let total = 0;
    this.processes.forEach(p => {
      if (p.status !== 'terminated') total += p.memoryMB;
    });
    return total;
  }

  getProcessCount(): number {
    return this.processes.size;
  }

  canLaunch(): boolean {
    return this.processes.size < this.maxProcesses;
  }
}

export const processManager = new ProcessManager();
