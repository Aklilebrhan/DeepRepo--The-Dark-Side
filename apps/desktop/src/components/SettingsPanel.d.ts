import React from 'react';
export interface SettingsPanelProps {
  ollamaHost: string;
  selectedModel: string;
  isOllamaConnected: boolean;
  onSaveSettings: (host: string, model: string) => void;
  onResetIndex: () => void;
  onCheckConnection: () => void;
}
export declare const SettingsPanel: React.FC<SettingsPanelProps>;
//# sourceMappingURL=SettingsPanel.d.ts.map
