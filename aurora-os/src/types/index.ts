export type AppStatus = 'running' | 'paused' | 'terminated';

export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: 'system' | 'productivity' | 'communication' | 'media' | 'utilities';
}

export interface AppInstance {
  id: string;
  definition: AppDefinition;
  status: AppStatus;
  memoryUsage: number;
  batteryDrain: number;
  launchedAt: number;
  lastActiveAt: number;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  minimized: boolean;
}

export interface Notification {
  id: string;
  appId: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  icon?: string;
}

export interface SystemState {
  batteryLevel: number;
  isCharging: boolean;
  brightness: number;
  volume: number;
  isDarkMode: boolean;
  isWifiOn: boolean;
  isBluetoothOn: boolean;
  isAirplaneMode: boolean;
  isDoNotDisturb: boolean;
  currentTime: Date;
  wallpaper: string;
  lockScreenWallpaper: string;
  totalStorage: number;
  usedStorage: number;
  totalMemory: number;
  usedMemory: number;
}

export interface SettingsState {
  brightness: number;
  volume: number;
  isDarkMode: boolean;
  isDoNotDisturb: boolean;
  isFocusMode: boolean;
  isMinimalistMode: boolean;
  language: 'es' | 'en' | 'ar' | 'he';
  timezone: string;
  wallpaper: string;
  lockScreenWallpaper: string;
  pinCode: string | null;
  biometricEnabled: boolean;
}

export interface FileSystemNode {
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

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  favorite: boolean;
}

export interface Message {
  id: string;
  contactId: string;
  text: string;
  timestamp: number;
  sent: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  modifiedAt: number;
  color: string;
}

export interface Alarm {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  days: number[];
}

export interface EmailAccount {
  id: string;
  address: string;
  name: string;
  incomingServer: string;
  outgoingServer: string;
}

export interface Email {
  id: string;
  accountId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: number;
  read: boolean;
  starred: boolean;
  attachments: string[];
}

export interface Widget {
  id: string;
  type: 'clock' | 'weather' | 'notes' | 'battery' | 'calendar';
  position: { x: number; y: number };
  size: { width: number; height: number };
}
