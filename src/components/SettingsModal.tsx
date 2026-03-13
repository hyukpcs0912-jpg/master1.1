import React, { useState, useEffect } from 'react';
import { X, Save, Check, AlertCircle, Download, Upload, Key, RefreshCw, Terminal, Copy } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { saveKeys, loadKeys, exportKeysToFile, importKeysFromFile, ApiKeys } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated: (keys: ApiKeys) => void;
}

export function SettingsModal({ isOpen, onClose, onKeysUpdated }: SettingsModalProps) {
  const [keys, setKeys] = useState<ApiKeys>({});
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = loadKeys();
      setKeys(stored);
      setStatus('idle');
      setMessage('');
    }
  }, [isOpen]);

  const handleSave = () => {
    saveKeys(keys);
    onKeysUpdated(keys);
    onClose();
  };

  const handleTest = async () => {
    setStatus('testing');
    setMessage('Testing connection...');
    try {
      const apiKey = keys.gemini || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("No API Key provided");
      
      const ai = new GoogleGenAI({ apiKey });
      // Use a cheap model for testing
      await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: { parts: [{ text: 'test' }] }
      });
      
      setStatus('success');
      setMessage('Connection successful!');
    } catch (e: any) {
      setStatus('error');
      setMessage(`Connection failed: ${e.message}`);
    }
  };

  const handleExport = () => {
    exportKeysToFile(keys);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const importedKeys = await importKeysFromFile(file);
      setKeys(importedKeys);
      saveKeys(importedKeys); // Auto-save on import
      onKeysUpdated(importedKeys);
      setStatus('success');
      setMessage('Keys imported successfully!');
    } catch (err) {
      setStatus('error');
      setMessage('Failed to import keys: Invalid file format');
    } finally {
      setIsImporting(false);
      // Reset file input
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-500" />
            API Key Settings
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={keys.gemini || ''}
                onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                placeholder="Enter your Gemini API Key"
                className="w-full px-4 py-2 pr-10 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              {keys.gemini && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your key is stored locally in your browser.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              네이버 검색 API
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-500">Client ID</label>
                <input
                  type="text"
                  value={keys.naverClientId || ''}
                  onChange={(e) => setKeys({ ...keys, naverClientId: e.target.value })}
                  placeholder="Naver Client ID"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-500">Client Secret</label>
                <input
                  type="password"
                  value={keys.naverClientSecret || ''}
                  onChange={(e) => setKeys({ ...keys, naverClientSecret: e.target.value })}
                  placeholder="Naver Client Secret"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              구글 Places API
            </h3>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-500">API Key</label>
              <input
                type="password"
                value={keys.googleApiKey || ''}
                onChange={(e) => setKeys({ ...keys, googleApiKey: e.target.value })}
                placeholder="Google API Key"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
              status === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
              status === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
              'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
            }`}>
              {status === 'success' ? <Check className="w-4 h-4" /> :
               status === 'error' ? <AlertCircle className="w-4 h-4" /> :
               <RefreshCw className="w-4 h-4 animate-spin" />}
              {message}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleTest}
              disabled={status === 'testing' || (!keys.gemini && !import.meta.env.VITE_GEMINI_API_KEY)}
              className="w-full py-2 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${status === 'testing' ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExport}
                className="py-2 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Export Keys
              </button>
              <label className="cursor-pointer py-2 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm">
                <Upload className="w-4 h-4" />
                {isImporting ? 'Importing...' : 'Import Keys'}
                <input 
                  type="file" 
                  accept=".enc,.json,.txt" 
                  onChange={handleImport} 
                  className="hidden" 
                  disabled={isImporting}
                />
              </label>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Save className="w-4 h-4" />
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
