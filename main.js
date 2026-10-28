/**
 * ============================================================================
 * THE VISHANTI CIPHER - MAIN PROCESS (ELECTRON)
 * Conforming strictly to Softablitz 2026 Rules & Specifications
 * ============================================================================
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const engine = require('./cryptoStegoEngine');

let mainWindow = null;

// Ensure cached stego buffer is accessible for direct saving
let lastStegoBuffer = null;
let lastOriginalRgb = null;
let lastStegoRgb = null;
let lastImageDimensions = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1060,
    minHeight: 740,
    autoHideMenuBar: true,
    title: 'The Vishanti Cipher | Mystic Desktop Steganography',
    backgroundColor: '#07080f',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.loadFile('index.html');

  if (process.argv.includes('--smoke-test')) {
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Electron smoke-test: index.html loaded cleanly into BrowserWindow.');
      setTimeout(() => {
        console.log('Electron smoke-test passed! Closing application.');
        app.quit();
      }, 1500);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================================================
// IPC HANDLERS - DIALOGS & FILE OPERATIONS
// ============================================================================

/**
 * Open host image dialog strictly filtered to lossless formats (PNG, BMP)
 */
ipcMain.handle('dialog:open-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Host Image (PNG or BMP)',
    properties: ['openFile'],
    filters: [
      { name: 'Lossless Images (*.png, *.bmp)', extensions: ['png', 'bmp'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];
  try {
    const fileBuffer = await fs.promises.readFile(filePath);
    const info = await engine.getImageInfo(fileBuffer);

    return {
      canceled: false,
      filePath,
      fileName: path.basename(filePath),
      fileBase64: fileBuffer.toString('base64'),
      info
    };
  } catch (err) {
    return {
      canceled: false,
      error: err.message
    };
  }
});

/**
 * Open secret payload file dialog for embedding any document/file
 */
ipcMain.handle('dialog:open-payload-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Secret File Payload to Conceal',
    properties: ['openFile']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];
  try {
    const fileBuffer = await fs.promises.readFile(filePath);
    return {
      canceled: false,
      filePath,
      fileName: path.basename(filePath),
      fileSize: fileBuffer.length,
      fileBase64: fileBuffer.toString('base64')
    };
  } catch (err) {
    return {
      canceled: false,
      error: err.message
    };
  }
});

/**
 * Save stego image strictly restricted to lossless PNG or BMP
 */
ipcMain.handle('dialog:save-stego-image', async (event, { format, dataBase64 }) => {
  const extension = (format && format.toLowerCase() === 'bmp') ? 'bmp' : 'png';
  const filterName = extension === 'bmp' ? 'Lossless Bitmap (*.bmp)' : 'Lossless PNG (*.png)';

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Sealed Stego Artifact',
    defaultPath: `vishanti_sealed_spell.${extension}`,
    filters: [
      { name: filterName, extensions: [extension] }
    ]
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  try {
    let bufferToWrite;
    if (dataBase64) {
      bufferToWrite = Buffer.from(dataBase64, 'base64');
    } else if (lastStegoBuffer) {
      bufferToWrite = lastStegoBuffer;
    } else {
      throw new Error('No stego image buffer available to save.');
    }

    await fs.promises.writeFile(result.filePath, bufferToWrite);
    return {
      canceled: false,
      savedPath: result.filePath,
      fileName: path.basename(result.filePath)
    };
  } catch (err) {
    return {
      canceled: false,
      error: err.message
    };
  }
});

/**
 * Save extracted secret payload file to disk
 */
ipcMain.handle('dialog:save-extracted-file', async (event, { fileName, dataBase64 }) => {
  const defaultName = fileName || 'unsealed_secret_scroll.bin';
  const ext = path.extname(defaultName).replace('.', '');

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Unsealed Secret File',
    defaultPath: defaultName,
    filters: ext ? [{ name: `${ext.toUpperCase()} File`, extensions: [ext] }, { name: 'All Files', extensions: ['*'] }] : [{ name: 'All Files', extensions: ['*'] }]
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  try {
    const fileBuffer = Buffer.from(dataBase64, 'base64');
    await fs.promises.writeFile(result.filePath, fileBuffer);
    return {
      canceled: false,
      savedPath: result.filePath
    };
  } catch (err) {
    return {
      canceled: false,
      error: err.message
    };
  }
});

// ============================================================================
// IPC HANDLERS - CRYPTO STEGO ENGINE OPERATIONS
// ============================================================================

/**
 * Analyze host image data and return real-time capacity metrics
 */
ipcMain.handle('engine:analyze-image', async (event, { imageBase64, isDual }) => {
  try {
    const buffer = Buffer.from(imageBase64, 'base64');
    const info = await engine.getImageInfo(buffer);
    return { success: true, info };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

/**
 * Seal Spell (Embedding)
 */
ipcMain.handle('engine:seal-spell', async (event, params) => {
  try {
    const hostImageBuffer = Buffer.from(params.hostImageBase64, 'base64');

    // Decode payloads
    const primaryPayload = {
      type: params.primaryPayload.type,
      text: params.primaryPayload.text,
      filename: params.primaryPayload.filename,
      data: params.primaryPayload.dataBase64
        ? Buffer.from(params.primaryPayload.dataBase64, 'base64')
        : undefined
    };

    let decoyPayload = null;
    if (params.isDualPayload && params.decoyPayload) {
      decoyPayload = {
        type: params.decoyPayload.type,
        text: params.decoyPayload.text,
        filename: params.decoyPayload.filename,
        data: params.decoyPayload.dataBase64
          ? Buffer.from(params.decoyPayload.dataBase64, 'base64')
          : undefined
      };
    }

    const sealResult = await engine.sealSpell({
      hostImage: hostImageBuffer,
      isDualPayload: params.isDualPayload,
      primaryPayload,
      primaryPassword: params.primaryPassword,
      decoyPayload,
      decoyPassword: params.decoyPassword,
      outputFormat: params.outputFormat || 'png'
    });

    // Cache stego buffer for quick saving
    lastStegoBuffer = sealResult.stegoBuffer;

    return {
      success: true,
      stegoBase64: sealResult.stegoBuffer.toString('base64'),
      originalPreviewUrl: sealResult.originalPreviewUrl,
      stegoPreviewUrl: sealResult.stegoPreviewUrl,
      diffPreviewUrl: sealResult.diffPreviewUrl,
      stats: sealResult.stats,
      dimensions: sealResult.dimensions,
      outputFormat: sealResult.outputFormat
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
});

/**
 * Reveal Spell (Extraction)
 * Conforms strictly to silent failure requirement
 */
ipcMain.handle('engine:reveal-spell', async (event, params) => {
  try {
    const stegoBuffer = Buffer.from(params.stegoImageBase64, 'base64');
    const result = await engine.revealSpell({
      stegoImage: stegoBuffer,
      password: params.password
    });
    return result;
  } catch (err) {
    // Fail gracefully with neutral status
    return {
      success: false,
      message: 'No incantation detected in the mystic weave.'
    };
  }
});

/**
 * Re-render Difference Map with adjusted amplification multiplier
 */
ipcMain.handle('engine:update-diff-amp', async (event, { originalBase64, stegoBase64, ampFactor }) => {
  try {
    const origObj = await engine.loadLosslessImage(Buffer.from(originalBase64, 'base64'));
    const stegoObj = await engine.loadLosslessImage(Buffer.from(stegoBase64, 'base64'));

    const diffResult = await engine.generateDifferenceMap(
      origObj.rawRgb,
      stegoObj.rawRgb,
      origObj.width,
      origObj.height,
      ampFactor || 50
    );

    return {
      success: true,
      diffPreviewUrl: diffResult.diffPngBase64,
      stats: diffResult.stats
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
