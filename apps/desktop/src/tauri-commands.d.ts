/**
 * Tauri command wrappers with seamless browser runtime fallback
 */
export interface SystemInfo {
  status: string;
  app: string;
  version: string;
  os: string;
}
export declare function isTauriEnvironment(): Promise<boolean>;
export declare function selectRepositoryDialog(): Promise<string | null>;
export declare function getSystemInfo(): Promise<SystemInfo>;
//# sourceMappingURL=tauri-commands.d.ts.map
