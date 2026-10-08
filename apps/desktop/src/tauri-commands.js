/**
 * Tauri command wrappers with seamless browser runtime fallback
 */
export async function isTauriEnvironment() {
    return typeof window !== 'undefined' && '__TAURI_METADATA__' in window;
}
export async function selectRepositoryDialog() {
    try {
        if (await isTauriEnvironment()) {
            const { open } = await import('@tauri-apps/api/dialog');
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Select Git Repository',
            });
            return typeof selected === 'string' ? selected : null;
        }
    }
    catch {
        // Fallback
    }
    return null;
}
export async function getSystemInfo() {
    try {
        if (await isTauriEnvironment()) {
            const { invoke } = await import('@tauri-apps/api/tauri');
            return await invoke('check_system');
        }
    }
    catch {
        // Fallback
    }
    return {
        status: 'ready',
        app: 'DeepRepo - The Dark Side',
        version: '0.1.0',
        os: 'browser',
    };
}
//# sourceMappingURL=tauri-commands.js.map