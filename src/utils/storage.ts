
export interface ApiKeys {
  gemini?: string;
  naverClientId?: string;
  naverClientSecret?: string;
  googleApiKey?: string;
}

const STORAGE_KEY = 'app_api_keys';

// Simple obfuscation to avoid storing plain text in localStorage
// Note: This is NOT secure encryption against determined attackers with local access,
// but prevents casual shoulder-surfing or accidental exposure.
export const saveKeys = (keys: ApiKeys) => {
  try {
    const serialized = JSON.stringify(keys);
    // Simple Base64 encoding
    const encoded = btoa(serialized);
    localStorage.setItem(STORAGE_KEY, encoded);
  } catch (e) {
    console.error("Failed to save keys to localStorage", e);
  }
};

export const loadKeys = (): ApiKeys => {
  try {
    const encoded = localStorage.getItem(STORAGE_KEY);
    if (!encoded) return {};
    const decoded = atob(encoded);
    return JSON.parse(decoded);
  } catch (e) {
    console.error("Failed to load keys from localStorage", e);
    return {};
  }
};

export const clearKeys = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const exportKeysToFile = (keys: ApiKeys) => {
    try {
        const serialized = JSON.stringify(keys);
        const encoded = btoa(serialized); // Obfuscated
        const blob = new Blob([encoded], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'api-keys.enc'; // .enc extension to imply encryption/encoding
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Failed to export keys", e);
    }
};

export const importKeysFromFile = (file: File): Promise<ApiKeys> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const encoded = e.target?.result as string;
                const decoded = atob(encoded);
                const keys = JSON.parse(decoded);
                resolve(keys);
            } catch (err) {
                reject(new Error("Invalid key file format"));
            }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
    });
};
