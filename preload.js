/**
 * ============================================================================
 * THE VISHANTI CIPHER - PRELOAD SCRIPT
 * Secure ContextBridge API for Electron Renderer
 * ============================================================================
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vishantiApi', {
  /**
   * Open native file dialog for lossless host image (PNG, BMP)
   */
  openHostImage: () => ipcRenderer.invoke('dialog:open-image'),

  /**
   * Open native file dialog for secret payload file
   */
  openPayloadFile: () => ipcRenderer.invoke('dialog:open-payload-file'),

  /**
   * Save sealed stego image strictly to lossless PNG or BMP
   */
  saveStegoImage: (params) => ipcRenderer.invoke('dialog:save-stego-image', params),

  /**
   * Export extracted secret payload file to disk
   */
  saveExtractedFile: (params) => ipcRenderer.invoke('dialog:save-extracted-file', params),

  /**
   * Analyze image buffer and get capacity metrics
   */
  analyzeImage: (params) => ipcRenderer.invoke('engine:analyze-image', params),

  /**
   * Seal spell (AES-256-GCM + Seeded Scattering + LSB Matching)
   */
  sealSpell: (params) => ipcRenderer.invoke('engine:seal-spell', params),

  /**
   * Reveal spell (Silent failure on wrong password or missing payload)
   */
  revealSpell: (params) => ipcRenderer.invoke('engine:reveal-spell', params),

  /**
   * Re-calculate difference map with custom amplification
   */
  updateDiffAmp: (params) => ipcRenderer.invoke('engine:update-diff-amp', params)
});
