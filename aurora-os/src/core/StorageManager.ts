import { eventBus } from './EventBus';

export interface StorageItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  mimeType?: string;
  size: number;
  createdAt: number;
  modifiedAt: number;
}

class StorageManager {
  private items: Map<string, StorageItem> = new Map();
  private totalStorage: number = 128 * 1024;
  private usedStorage: number = 32 * 1024;

  constructor() {
    this.initDefaultStructure();
  }

  private initDefaultStructure(): void {
    const folders = [
      { id: 'root', name: '/', type: 'folder' as const, parentId: null },
      { id: 'documents', name: 'Documents', type: 'folder' as const, parentId: 'root' },
      { id: 'downloads', name: 'Downloads', type: 'folder' as const, parentId: 'root' },
      { id: 'pictures', name: 'Pictures', type: 'folder' as const, parentId: 'root' },
      { id: 'music', name: 'Music', type: 'folder' as const, parentId: 'root' },
      { id: 'videos', name: 'Videos', type: 'folder' as const, parentId: 'root' },
      { id: 'dcim', name: 'DCIM', type: 'folder' as const, parentId: 'pictures' },
      { id: 'screenshots', name: 'Screenshots', type: 'folder' as const, parentId: 'pictures' },
    ];

    folders.forEach(f => {
      this.items.set(f.id, {
        ...f,
        size: 0,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      });
    });
  }

  getChildren(parentId: string): StorageItem[] {
    return Array.from(this.items.values()).filter(item => item.parentId === parentId);
  }

  getItem(id: string): StorageItem | undefined {
    return this.items.get(id);
  }

  createFile(name: string, parentId: string, content: string = '', mimeType: string = 'text/plain'): StorageItem {
    const id = `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const size = new Blob([content]).size;
    const item: StorageItem = {
      id,
      name,
      type: 'file',
      parentId,
      content,
      mimeType,
      size,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };
    this.items.set(id, item);
    this.usedStorage += size;
    eventBus.emit('storage:changed', { used: this.usedStorage, total: this.totalStorage });
    return item;
  }

  createFolder(name: string, parentId: string): StorageItem {
    const id = `folder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const item: StorageItem = {
      id,
      name,
      type: 'folder',
      parentId,
      size: 0,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };
    this.items.set(id, item);
    return item;
  }

  deleteItem(id: string): boolean {
    const item = this.items.get(id);
    if (!item || id === 'root') return false;

    if (item.type === 'folder') {
      this.getChildren(id).forEach(child => this.deleteItem(child.id));
    }

    this.usedStorage -= item.size;
    this.items.delete(id);
    eventBus.emit('storage:changed', { used: this.usedStorage, total: this.totalStorage });
    return true;
  }

  getTotal(): number {
    return this.totalStorage;
  }

  getUsed(): number {
    return this.usedStorage;
  }

  getFree(): number {
    return this.totalStorage - this.usedStorage;
  }

  getUsagePercent(): number {
    return (this.usedStorage / this.totalStorage) * 100;
  }

  getPath(itemId: string): string {
    const parts: string[] = [];
    let current = this.items.get(itemId);
    while (current && current.parentId) {
      parts.unshift(current.name);
      current = this.items.get(current.parentId);
    }
    return '/' + parts.join('/');
  }

  search(query: string): StorageItem[] {
    const lower = query.toLowerCase();
    return Array.from(this.items.values()).filter(item =>
      item.name.toLowerCase().includes(lower)
    );
  }
}

export const storageManager = new StorageManager();
