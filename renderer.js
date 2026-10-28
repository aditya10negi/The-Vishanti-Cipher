/**
 * ============================================================================
 * THE VISHANTI CIPHER - RENDERER SCRIPT
 * Modern Interactive Desktop UI Logic Conforming to Softablitz 2026
 * ============================================================================
 */

// Global State
const state = {
  activeView: 'seal', // 'seal' | 'reveal'
  hostImage: null, // { fileName, base64, width, height, format, capacitySingle, capacityDual }
  stegoResult: null, // { stegoBase64, originalUrl, stegoUrl, diffUrl, stats, dimensions, format }
  extractedSecret: null, // { type, filename, text, dataBase64, byteLength, partitionMode }
  
  // Single Payload Inputs
  singlePayloadType: 'text', // 'text' | 'file'
  singleFile: null, // { fileName, size, base64 }

  // Dual Payload Inputs
  isDualPayload: false,
  decoyPayloadType: 'text',
  decoyFile: null,
  dualMasterPayloadType: 'text',
  dualMasterFile: null,

  // Reveal Inputs
  revealImage: null, // { fileName, base64, width, height, format }

  // Visualizer View
  activeViewportTab: 'split', // 'split' | 'original' | 'stego' | 'diff'
  splitPosition: 50, // 0 - 100%
  splitMode: 'stego', // 'stego' (Original ⇋ Stego) | 'diff' (Original ⇋ Diff Heatmap)
  diffBgMode: 'void', // 'void' (Cosmic Void) | 'overlay' (Host Vessel Overlay)
  diffPulse: false,
  diffAmpFactor: 50
};

// ============================================================================
// AUDIO SYNTHESIZER (PROCEDURAL WEB AUDIO API)
// ============================================================================
class MysticAudio {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Subtle mystical chime on seal
  playSealChime() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35); // A5

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {
      // Audio is non-critical enhancement
    }
  }

  // Triumphant resonance on reveal
  playRevealResonance() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.55);
      });
    } catch (e) {}
  }
}

const audio = new MysticAudio();

// ============================================================================
// DOM ELEMENTS REFERENCE
// ============================================================================
const dom = {
  // Navigation
  tabSeal: document.getElementById('tabSeal'),
  tabReveal: document.getElementById('tabReveal'),
  sealView: document.getElementById('sealView'),
  revealView: document.getElementById('revealView'),

  // Host Image
  hostDropZone: document.getElementById('hostDropZone'),
  hostFileInput: document.getElementById('hostFileInput'),
  btnBrowseHost: document.getElementById('btnBrowseHost'),
  hostDropPrompt: document.getElementById('hostDropPrompt'),
  hostLoadedInfo: document.getElementById('hostLoadedInfo'),
  hostThumbImg: document.getElementById('hostThumbImg'),
  hostFileName: document.getElementById('hostFileName'),
  hostDimensions: document.getElementById('hostDimensions'),
  hostFormat: document.getElementById('hostFormat'),
  btnChangeHost: document.getElementById('btnChangeHost'),

  // Capacity Engine
  capacityValueText: document.getElementById('capacityValueText'),
  capacityBarFill: document.getElementById('capacityBarFill'),
  capacityUsageText: document.getElementById('capacityUsageText'),

  // Plausible Deniability
  chkPlausibleDeniability: document.getElementById('chkPlausibleDeniability'),
  singlePayloadContainer: document.getElementById('singlePayloadContainer'),
  dualPayloadContainer: document.getElementById('dualPayloadContainer'),

  // Single Secret Inputs
  singleTextInputGroup: document.getElementById('singleTextInputGroup'),
  singleFileInputGroup: document.getElementById('singleFileInputGroup'),
  singleTextPayload: document.getElementById('singleTextPayload'),
  singleFileDropBox: document.getElementById('singleFileDropBox'),
  singleFileName: document.getElementById('singleFileName'),
  btnBrowseSingleFile: document.getElementById('btnBrowseSingleFile'),
  singlePassword: document.getElementById('singlePassword'),

  // Decoy Inputs
  decoyTextInputGroup: document.getElementById('decoyTextInputGroup'),
  decoyFileInputGroup: document.getElementById('decoyFileInputGroup'),
  decoyTextPayload: document.getElementById('decoyTextPayload'),
  decoyFileDropBox: document.getElementById('decoyFileDropBox'),
  decoyFileName: document.getElementById('decoyFileName'),
  btnBrowseDecoyFile: document.getElementById('btnBrowseDecoyFile'),
  decoyPassword: document.getElementById('decoyPassword'),

  // Dual Master Inputs
  dualMasterTextInputGroup: document.getElementById('dualMasterTextInputGroup'),
  dualMasterFileInputGroup: document.getElementById('dualMasterFileInputGroup'),
  dualMasterTextPayload: document.getElementById('dualMasterTextPayload'),
  dualMasterFileDropBox: document.getElementById('dualMasterFileDropBox'),
  dualMasterFileName: document.getElementById('dualMasterFileName'),
  btnBrowseDualMasterFile: document.getElementById('btnBrowseDualMasterFile'),
  dualMasterPassword: document.getElementById('dualMasterPassword'),

  // Sealing Action
  btnSealSpell: document.getElementById('btnSealSpell'),

  // Visualizer Viewport
  viewportTabs: document.querySelectorAll('.vtab-btn'),
  viewportStage: document.getElementById('viewportStage'),
  viewportEmpty: document.getElementById('viewportEmpty'),
  splitViewContainer: document.getElementById('splitViewContainer'),
  splitOriginalImg: document.getElementById('splitOriginalImg'),
  splitStegoImg: document.getElementById('splitStegoImg'),
  splitOverlay: document.getElementById('splitOverlay'),
  splitHandle: document.getElementById('splitHandle'),
  splitLabelLeft: document.getElementById('splitLabelLeft'),
  splitLabelRight: document.getElementById('splitLabelRight'),
  btnToggleSplitMode: document.getElementById('btnToggleSplitMode'),
  splitModeText: document.getElementById('splitModeText'),
  singleViewContainer: document.getElementById('singleViewContainer'),
  singleViewImg: document.getElementById('singleViewImg'),
  singleViewTag: document.getElementById('singleViewTag'),
  diffViewContainer: document.getElementById('diffViewContainer'),
  diffUnderlayImg: document.getElementById('diffUnderlayImg'),
  diffMapImg: document.getElementById('diffMapImg'),
  diffEmptyBanner: document.getElementById('diffEmptyBanner'),
  diffAmpSlider: document.getElementById('diffAmpSlider'),
  ampFactorText: document.getElementById('ampFactorText'),
  btnDiffBgMode: document.getElementById('btnDiffBgMode'),
  diffBgModeText: document.getElementById('diffBgModeText'),
  btnDiffPulse: document.getElementById('btnDiffPulse'),
  diffPulseText: document.getElementById('diffPulseText'),

  // Metrics Bar
  metricsBar: document.getElementById('metricsBar'),
  metricPixels: document.getElementById('metricPixels'),
  metricPercent: document.getElementById('metricPercent'),
  metricPsnr: document.getElementById('metricPsnr'),
  metricDefense: document.getElementById('metricDefense'),
  btnSaveStego: document.getElementById('btnSaveStego'),

  // Reveal Elements
  revealDropZone: document.getElementById('revealDropZone'),
  revealFileInput: document.getElementById('revealFileInput'),
  btnBrowseReveal: document.getElementById('btnBrowseReveal'),
  revealDropPrompt: document.getElementById('revealDropPrompt'),
  revealLoadedInfo: document.getElementById('revealLoadedInfo'),
  revealThumbImg: document.getElementById('revealThumbImg'),
  revealFileName: document.getElementById('revealFileName'),
  revealDimensions: document.getElementById('revealDimensions'),
  revealFormat: document.getElementById('revealFormat'),
  btnChangeReveal: document.getElementById('btnChangeReveal'),
  revealPassword: document.getElementById('revealPassword'),
  btnRevealSpell: document.getElementById('btnRevealSpell'),
  revealNeutralBanner: document.getElementById('revealNeutralBanner'),
  revealSuccessBanner: document.getElementById('revealSuccessBanner'),
  revealPartitionTag: document.getElementById('revealPartitionTag'),
  revealSuccessDesc: document.getElementById('revealSuccessDesc'),
  revealTextBox: document.getElementById('revealTextBox'),
  revealTextContent: document.getElementById('revealTextContent'),
  btnCopySecretText: document.getElementById('btnCopySecretText'),
  revealFileBox: document.getElementById('revealFileBox'),
  revealUnsealedFileName: document.getElementById('revealUnsealedFileName'),
  revealUnsealedFileSize: document.getElementById('revealUnsealedFileSize'),
  btnExportSecretFile: document.getElementById('btnExportSecretFile'),

  toastContainer: document.getElementById('toastContainer')
};

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================
function showToast(message, type = 'info', duration = 3500) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✨' : type === 'error' ? '⚠️' : '🔮';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Format byte sizes into readable units
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// ============================================================================
// NAVIGATION & VIEW SWITCHING
// ============================================================================
function switchView(target) {
  state.activeView = target;
  if (target === 'seal') {
    dom.tabSeal.classList.add('active');
    dom.tabSeal.setAttribute('aria-selected', 'true');
    dom.tabReveal.classList.remove('active');
    dom.tabReveal.setAttribute('aria-selected', 'false');
    dom.sealView.classList.add('active');
    dom.revealView.classList.remove('active');
  } else {
    dom.tabReveal.classList.add('active');
    dom.tabReveal.setAttribute('aria-selected', 'true');
    dom.tabSeal.classList.remove('active');
    dom.tabSeal.setAttribute('aria-selected', 'false');
    dom.revealView.classList.add('active');
    dom.sealView.classList.remove('active');
  }
}

dom.tabSeal.addEventListener('click', () => switchView('seal'));
dom.tabReveal.addEventListener('click', () => switchView('reveal'));

// Password visibility toggles
document.querySelectorAll('.btn-toggle-pass').forEach(btn => {
  btn.addEventListener('click', () => {
    const inputId = btn.getAttribute('data-for');
    const input = document.getElementById(inputId);
    if (input) {
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🔒';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    }
  });
});

// ============================================================================
// CAPACITY ENGINE CALCULATION (B4)
// ============================================================================
function updateCapacityEngine() {
  if (!state.hostImage) {
    dom.capacityValueText.textContent = '0 Bytes';
    dom.capacityBarFill.style.width = '0%';
    dom.capacityBarFill.classList.remove('overflow');
    dom.capacityUsageText.textContent = '0% Consumed';
    return;
  }

  const isDual = state.isDualPayload;
  const maxAllowedBytes = isDual
    ? state.hostImage.capacityDual
    : state.hostImage.capacitySingle;

  dom.capacityValueText.textContent = `${formatBytes(maxAllowedBytes)} ${isDual ? '(per secret)' : 'usable'}`;

  // Calculate current payload consumption in bytes
  let currentPayloadBytes = 0;

  if (!isDual) {
    if (state.singlePayloadType === 'text') {
      const text = dom.singleTextPayload.value || '';
      currentPayloadBytes = new TextEncoder().encode(text).length;
    } else if (state.singleFile) {
      currentPayloadBytes = state.singleFile.size;
    }
  } else {
    let decoyBytes = 0;
    if (state.decoyPayloadType === 'text') {
      decoyBytes = new TextEncoder().encode(dom.decoyTextPayload.value || '').length;
    } else if (state.decoyFile) {
      decoyBytes = state.decoyFile.size;
    }

    let masterBytes = 0;
    if (state.dualMasterPayloadType === 'text') {
      masterBytes = new TextEncoder().encode(dom.dualMasterTextPayload.value || '').length;
    } else if (state.dualMasterFile) {
      masterBytes = state.dualMasterFile.size;
    }

    currentPayloadBytes = Math.max(decoyBytes, masterBytes);
  }

  const ratio = maxAllowedBytes > 0 ? (currentPayloadBytes / maxAllowedBytes) : 0;
  const percentage = Math.min(100, (ratio * 100)).toFixed(1);

  dom.capacityBarFill.style.width = `${Math.min(100, ratio * 100)}%`;
  dom.capacityUsageText.textContent = `${formatBytes(currentPayloadBytes)} / ${percentage}% Consumed`;

  if (currentPayloadBytes > maxAllowedBytes) {
    dom.capacityBarFill.classList.add('overflow');
    dom.capacityUsageText.style.color = '#ff4757';
  } else {
    dom.capacityBarFill.classList.remove('overflow');
    dom.capacityUsageText.style.color = 'var(--text-secondary)';
  }
}

// Live capacity update listeners
['input', 'change', 'keyup'].forEach(evt => {
  dom.singleTextPayload.addEventListener(evt, updateCapacityEngine);
  dom.decoyTextPayload.addEventListener(evt, updateCapacityEngine);
  dom.dualMasterTextPayload.addEventListener(evt, updateCapacityEngine);
});

// ============================================================================
// PLAUSIBLE DENIABILITY TOGGLE (A2)
// ============================================================================
dom.chkPlausibleDeniability.addEventListener('change', (e) => {
  state.isDualPayload = e.target.checked;
  if (state.isDualPayload) {
    dom.singlePayloadContainer.classList.add('hidden');
    dom.dualPayloadContainer.classList.remove('hidden');
    showToast('Plausible Deniability enabled. Dual disjoint partitions initialized.', 'info');
  } else {
    dom.singlePayloadContainer.classList.remove('hidden');
    dom.dualPayloadContainer.classList.add('hidden');
  }
  updateCapacityEngine();
});

// Payload Type Pills (Text vs File)
document.querySelectorAll('.pill-btn').forEach(pill => {
  pill.addEventListener('click', () => {
    const target = pill.getAttribute('data-target');
    const type = pill.getAttribute('data-payload-type');
    const parent = pill.closest('.secret-box-header');
    parent.querySelectorAll('.pill-btn').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    if (target === 'single') {
      state.singlePayloadType = type;
      if (type === 'text') {
        dom.singleTextInputGroup.classList.remove('hidden');
        dom.singleFileInputGroup.classList.add('hidden');
      } else {
        dom.singleTextInputGroup.classList.add('hidden');
        dom.singleFileInputGroup.classList.remove('hidden');
      }
    } else if (target === 'decoy') {
      state.decoyPayloadType = type;
      if (type === 'text') {
        dom.decoyTextInputGroup.classList.remove('hidden');
        dom.decoyFileInputGroup.classList.add('hidden');
      } else {
        dom.decoyTextInputGroup.classList.add('hidden');
        dom.decoyFileInputGroup.classList.remove('hidden');
      }
    } else if (target === 'dual-master') {
      state.dualMasterPayloadType = type;
      if (type === 'text') {
        dom.dualMasterTextInputGroup.classList.remove('hidden');
        dom.dualMasterFileInputGroup.classList.add('hidden');
      } else {
        dom.dualMasterTextInputGroup.classList.add('hidden');
        dom.dualMasterFileInputGroup.classList.remove('hidden');
      }
    }

    updateCapacityEngine();
  });
});

// ============================================================================
// HOST IMAGE SELECTION & DRAG-AND-DROP (B1 & B5)
// ============================================================================
async function processHostImageFile(file) {
  // Validate format extension strictly to PNG or BMP
  const name = file.name.toLowerCase();
  if (!name.endsWith('.png') && !name.endsWith('.bmp')) {
    showToast('Vishanti law permits only lossless PNG or BMP host images.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const arrayBuf = e.target.result;
      const base64 = arrayBufferToBase64(arrayBuf);

      const res = await window.vishantiApi.analyzeImage({
        imageBase64: base64,
        isDual: state.isDualPayload
      });

      if (!res.success) {
        showToast(res.error || 'Failed to analyze host vessel.', 'error');
        return;
      }

      state.hostImage = {
        fileName: file.name,
        base64: base64,
        width: res.info.width,
        height: res.info.height,
        format: res.info.format.toUpperCase(),
        capacitySingle: res.info.singleCapacityBytes,
        capacityDual: res.info.dualCapacityBytesPerSecret,
        previewUrl: res.info.previewUrl
      };

      // Update UI
      dom.hostDropPrompt.classList.add('hidden');
      dom.hostLoadedInfo.classList.remove('hidden');
      dom.hostThumbImg.src = state.hostImage.previewUrl;
      dom.hostFileName.textContent = state.hostImage.fileName;
      dom.hostDimensions.textContent = `${state.hostImage.width} × ${state.hostImage.height} px`;
      dom.hostFormat.textContent = state.hostImage.format;

      updateCapacityEngine();
      renderViewport();
      showToast(`Host vessel linked: ${state.hostImage.width}×${state.hostImage.height} (${state.hostImage.format})`, 'success');
    } catch (err) {
      showToast('Error processing host image: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

// Drag & drop handlers for Host Drop Zone
dom.hostDropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dom.hostDropZone.classList.add('dragover');
});

dom.hostDropZone.addEventListener('dragleave', () => {
  dom.hostDropZone.classList.remove('dragover');
});

dom.hostDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dom.hostDropZone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    processHostImageFile(e.dataTransfer.files[0]);
  }
});

dom.btnBrowseHost.addEventListener('click', async (e) => {
  e.stopPropagation();
  if (window.vishantiApi) {
    const res = await window.vishantiApi.openHostImage();
    if (res.canceled) return;
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    state.hostImage = {
      fileName: res.fileName,
      base64: res.fileBase64,
      width: res.info.width,
      height: res.info.height,
      format: res.info.format.toUpperCase(),
      capacitySingle: res.info.singleCapacityBytes,
      capacityDual: res.info.dualCapacityBytesPerSecret,
      previewUrl: res.info.previewUrl
    };

    dom.hostDropPrompt.classList.add('hidden');
    dom.hostLoadedInfo.classList.remove('hidden');
    dom.hostThumbImg.src = state.hostImage.previewUrl;
    dom.hostFileName.textContent = state.hostImage.fileName;
    dom.hostDimensions.textContent = `${state.hostImage.width} × ${state.hostImage.height} px`;
    dom.hostFormat.textContent = state.hostImage.format;

    updateCapacityEngine();
    renderViewport();
    showToast(`Host linked: ${state.hostImage.fileName}`, 'success');
  } else {
    dom.hostFileInput.click();
  }
});

dom.hostFileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length > 0) {
    processHostImageFile(e.target.files[0]);
  }
});

dom.btnChangeHost.addEventListener('click', (e) => {
  e.stopPropagation();
  state.hostImage = null;
  state.stegoResult = null;
  dom.hostLoadedInfo.classList.add('hidden');
  dom.hostDropPrompt.classList.remove('hidden');
  dom.hostFileInput.value = '';
  updateCapacityEngine();
  renderViewport();
});

// ============================================================================
// SECRET FILE PAYLOAD SELECTION (Single, Decoy, Master)
// ============================================================================
async function selectPayloadFile(target) {
  if (window.vishantiApi) {
    const res = await window.vishantiApi.openPayloadFile();
    if (res.canceled) return;
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    const fileObj = {
      fileName: res.fileName,
      size: res.fileSize,
      base64: res.fileBase64
    };

    if (target === 'single') {
      state.singleFile = fileObj;
      dom.singleFileName.textContent = `${fileObj.fileName} (${formatBytes(fileObj.size)})`;
    } else if (target === 'decoy') {
      state.decoyFile = fileObj;
      dom.decoyFileName.textContent = `${fileObj.fileName} (${formatBytes(fileObj.size)})`;
    } else if (target === 'dual-master') {
      state.dualMasterFile = fileObj;
      dom.dualMasterFileName.textContent = `${fileObj.fileName} (${formatBytes(fileObj.size)})`;
    }
    updateCapacityEngine();
    showToast(`Secret payload linked: ${fileObj.fileName}`, 'info');
  }
}

dom.btnBrowseSingleFile.addEventListener('click', () => selectPayloadFile('single'));
dom.btnBrowseDecoyFile.addEventListener('click', () => selectPayloadFile('decoy'));
dom.btnBrowseDualMasterFile.addEventListener('click', () => selectPayloadFile('dual-master'));

// ============================================================================
// WEAVE & SEAL SPELL (EMBEDDING)
// ============================================================================
dom.btnSealSpell.addEventListener('click', async () => {
  if (!state.hostImage) {
    showToast('Please load a lossless PNG or BMP host canvas vessel first.', 'error');
    return;
  }

  // Retrieve selected output format (PNG or BMP)
  const formatRadio = document.querySelector('input[name="outputFormat"]:checked');
  const outputFormat = formatRadio ? formatRadio.value : 'png';

  let sealParams;

  if (!state.isDualPayload) {
    // Single Payload Validation
    const password = dom.singlePassword.value || '';
    if (!password.trim()) {
      showToast('Master incantation passphrase cannot be empty.', 'error');
      dom.singlePassword.focus();
      return;
    }

    let payload;
    if (state.singlePayloadType === 'text') {
      const text = dom.singleTextPayload.value || '';
      if (!text.trim()) {
        showToast('Please enter secret spell text to conceal.', 'error');
        dom.singleTextPayload.focus();
        return;
      }
      payload = { type: 'text', text };
    } else {
      if (!state.singleFile) {
        showToast('Please select a secret file to conceal.', 'error');
        return;
      }
      payload = {
        type: 'file',
        filename: state.singleFile.fileName,
        dataBase64: state.singleFile.base64
      };
    }

    sealParams = {
      hostImageBase64: state.hostImage.base64,
      isDualPayload: false,
      primaryPayload: payload,
      primaryPassword: password,
      outputFormat
    };
  } else {
    // Dual Payload Validation
    const decoyPass = dom.decoyPassword.value || '';
    const masterPass = dom.dualMasterPassword.value || '';

    if (!decoyPass.trim()) {
      showToast('Decoy incantation passphrase is required.', 'error');
      dom.decoyPassword.focus();
      return;
    }
    if (!masterPass.trim()) {
      showToast('Sanctum Master incantation passphrase is required.', 'error');
      dom.dualMasterPassword.focus();
      return;
    }

    if (decoyPass.trim() === masterPass.trim()) {
      showToast('Decoy and Master incantations must be distinct for plausible deniability.', 'error');
      return;
    }

    // Decoy payload
    let decoyPayload;
    if (state.decoyPayloadType === 'text') {
      const text = dom.decoyTextPayload.value || '';
      if (!text.trim()) {
        showToast('Please enter decoy message.', 'error');
        dom.decoyTextPayload.focus();
        return;
      }
      decoyPayload = { type: 'text', text };
    } else {
      if (!state.decoyFile) {
        showToast('Please select a decoy file.', 'error');
        return;
      }
      decoyPayload = {
        type: 'file',
        filename: state.decoyFile.fileName,
        dataBase64: state.decoyFile.base64
      };
    }

    // Master payload
    let masterPayload;
    if (state.dualMasterPayloadType === 'text') {
      const text = dom.dualMasterTextPayload.value || '';
      if (!text.trim()) {
        showToast('Please enter true sanctum secret text.', 'error');
        dom.dualMasterTextPayload.focus();
        return;
      }
      masterPayload = { type: 'text', text };
    } else {
      if (!state.dualMasterFile) {
        showToast('Please select a secret master file.', 'error');
        return;
      }
      masterPayload = {
        type: 'file',
        filename: state.dualMasterFile.fileName,
        dataBase64: state.dualMasterFile.base64
      };
    }

    sealParams = {
      hostImageBase64: state.hostImage.base64,
      isDualPayload: true,
      primaryPayload: masterPayload,
      primaryPassword: masterPass,
      decoyPayload: decoyPayload,
      decoyPassword: decoyPass,
      outputFormat
    };
  }

  // Execute Sealing
  dom.btnSealSpell.disabled = true;
  dom.btnSealSpell.querySelector('.btn-text').textContent = 'Weaving Arcane Lattice...';

  try {
    const result = await window.vishantiApi.sealSpell(sealParams);

    if (!result.success) {
      showToast(result.error || 'Failed to seal spell into vessel.', 'error');
      return;
    }

    state.stegoResult = result;
    audio.playSealChime();

    // Enable visualizer viewport
    dom.viewportEmpty.classList.add('hidden');
    dom.splitOriginalImg.src = result.originalPreviewUrl;
    dom.splitStegoImg.src = result.stegoPreviewUrl;
    dom.diffMapImg.src = result.diffPreviewUrl;

    // Update metrics bar
    dom.metricPixels.textContent = `${result.stats.modifiedPixels.toLocaleString()} px`;
    dom.metricPercent.textContent = `${result.stats.modifiedPercent}%`;
    dom.metricPsnr.textContent = result.stats.psnr;

    // Enable Save button
    dom.btnSaveStego.disabled = false;
    dom.btnSaveStego.classList.remove('disabled');

    // Switch to active viewport tab
    renderViewport();

    showToast('Spell sealed! LSB matching (±1) applied with seeded scattering.', 'success');
  } catch (err) {
    showToast('Sealing spell failed: ' + err.message, 'error');
  } finally {
    dom.btnSealSpell.disabled = false;
    dom.btnSealSpell.querySelector('.btn-text').textContent = 'Weave & Seal Spell';
  }
});

// ============================================================================
// VISUALIZER VIEWPORT & SPLIT SLIDER
// ============================================================================
function getPristineDiffMapUrl(w = 100, h = 100) {
  const c = document.createElement('canvas');
  c.width = Math.min(800, w || 600);
  c.height = Math.min(500, h || 400);
  const ctx = c.getContext('2d');
  
  // Cosmic void background
  ctx.fillStyle = '#020308';
  ctx.fillRect(0, 0, c.width, c.height);

  // Subtle starry grid
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
  ctx.lineWidth = 1;
  const step = 40;
  for (let x = 0; x < c.width; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke();
  }
  for (let y = 0; y < c.height; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke();
  }

  // Central Radar Reticle
  const cx = c.width / 2;
  const cy = c.height / 2;
  ctx.strokeStyle = 'rgba(255, 170, 29, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, 70, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
  ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.stroke();

  // Radar crosshairs
  ctx.beginPath(); ctx.moveTo(cx - 130, cy); ctx.lineTo(cx + 130, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 130); ctx.lineTo(cx, cy + 130); ctx.stroke();

  return c.toDataURL('image/png');
}

function renderViewport() {
  if (!state.hostImage && !state.stegoResult) {
    dom.viewportEmpty.classList.remove('hidden');
    dom.splitViewContainer.classList.add('hidden');
    dom.singleViewContainer.classList.add('hidden');
    dom.diffViewContainer.classList.add('hidden');
    dom.btnSaveStego.disabled = true;
    dom.btnSaveStego.classList.add('disabled');
    dom.metricPixels.textContent = '—';
    dom.metricPercent.textContent = '—';
    dom.metricPsnr.textContent = '—';
    return;
  }

  // Activate viewport stage
  dom.viewportEmpty.classList.add('hidden');
  dom.splitViewContainer.classList.add('hidden');
  dom.singleViewContainer.classList.add('hidden');
  dom.diffViewContainer.classList.add('hidden');

  const originalUrl = state.stegoResult
    ? state.stegoResult.originalPreviewUrl
    : (state.hostImage ? state.hostImage.previewUrl : '');

  const stegoUrl = state.stegoResult
    ? (state.splitMode === 'diff' ? state.stegoResult.diffPreviewUrl : state.stegoResult.stegoPreviewUrl)
    : (state.hostImage ? state.hostImage.previewUrl : '');

  // Live metrics update
  if (state.stegoResult) {
    dom.metricPixels.textContent = `${state.stegoResult.stats.modifiedPixels.toLocaleString()} px`;
    dom.metricPercent.textContent = `${state.stegoResult.stats.modifiedPercent}%`;
    dom.metricPsnr.textContent = state.stegoResult.stats.psnr;
    dom.metricDefense.textContent = 'LSB Matching (Chi-Square Immune)';
    dom.btnSaveStego.disabled = false;
    dom.btnSaveStego.classList.remove('disabled');
  } else if (state.hostImage) {
    dom.metricPixels.textContent = '0 px (Pristine)';
    dom.metricPercent.textContent = '0.00%';
    dom.metricPsnr.textContent = 'Infinite (Pristine)';
    dom.metricDefense.textContent = 'LSB Matching (Ready)';
    dom.btnSaveStego.disabled = true;
    dom.btnSaveStego.classList.add('disabled');
  }

  if (state.activeViewportTab === 'split') {
    dom.splitViewContainer.classList.remove('hidden');
    dom.splitOriginalImg.src = originalUrl;
    dom.splitStegoImg.src = stegoUrl;

    if (state.stegoResult) {
      dom.btnToggleSplitMode.classList.remove('hidden');
      dom.splitLabelLeft.textContent = 'Original Vessel';
      dom.splitLabelRight.textContent = state.splitMode === 'diff' ? 'Diff Heatmap Reveal' : 'Sealed Stego';
    } else {
      dom.btnToggleSplitMode.classList.add('hidden');
      dom.splitLabelLeft.textContent = 'Original Vessel';
      dom.splitLabelRight.textContent = 'Vessel (Ready for Weave)';
    }

    updateSplitHandle(state.splitPosition);
  } else if (state.activeViewportTab === 'original') {
    dom.singleViewContainer.classList.remove('hidden');
    dom.singleViewImg.src = originalUrl;
    dom.singleViewTag.textContent = '[FEED // PRISTINE HOST VESSEL]';
  } else if (state.activeViewportTab === 'stego') {
    dom.singleViewContainer.classList.remove('hidden');
    dom.singleViewImg.src = state.stegoResult ? state.stegoResult.stegoPreviewUrl : (state.hostImage ? state.hostImage.previewUrl : '');
    dom.singleViewTag.textContent = state.stegoResult
      ? '[FEED // SEALED STEGO ARTIFACT • LSB MATCHING APPLIED]'
      : '[FEED // HOST VESSEL • AWAITING SPELL WEAVE]';
  } else if (state.activeViewportTab === 'diff') {
    dom.diffViewContainer.classList.remove('hidden');
    if (state.stegoResult) {
      dom.diffEmptyBanner.classList.add('hidden');
      dom.diffMapImg.src = state.stegoResult.diffPreviewUrl;
      if (state.diffBgMode === 'overlay') {
        dom.diffUnderlayImg.src = state.stegoResult.originalPreviewUrl;
        dom.diffUnderlayImg.classList.remove('hidden');
        dom.diffMapImg.classList.add('overlay-mode');
      } else {
        dom.diffUnderlayImg.classList.add('hidden');
        dom.diffMapImg.classList.remove('overlay-mode');
      }
    } else if (state.hostImage) {
      dom.diffEmptyBanner.classList.remove('hidden');
      dom.diffUnderlayImg.classList.add('hidden');
      dom.diffMapImg.classList.remove('overlay-mode');
      dom.diffMapImg.src = getPristineDiffMapUrl(state.hostImage.width, state.hostImage.height);
    }
  }
}

// Viewport tab switcher
dom.viewportTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    dom.viewportTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.activeViewportTab = tab.getAttribute('data-vtab');
    renderViewport();
  });
});

// Interactive Split Slider Logic using CSS variable & clip-path
function updateSplitHandle(percent) {
  state.splitPosition = Math.max(0, Math.min(100, percent));
  dom.splitViewContainer.style.setProperty('--split-pos', `${state.splitPosition}%`);
  dom.splitOverlay.style.clipPath = `inset(0 0 0 ${state.splitPosition}%)`;
  dom.splitHandle.style.left = `${state.splitPosition}%`;
}

let isDraggingSplit = false;

function handleSplitDrag(clientX) {
  const rect = dom.splitViewContainer.getBoundingClientRect();
  if (rect.width === 0) return;
  const offsetX = clientX - rect.left;
  const percent = (offsetX / rect.width) * 100;
  updateSplitHandle(percent);
}

dom.splitHandle.addEventListener('mousedown', (e) => {
  isDraggingSplit = true;
  e.preventDefault();
});

dom.splitViewContainer.addEventListener('mousedown', (e) => {
  isDraggingSplit = true;
  handleSplitDrag(e.clientX);
});

window.addEventListener('mouseup', () => {
  isDraggingSplit = false;
});

window.addEventListener('mousemove', (e) => {
  if (!isDraggingSplit) return;
  handleSplitDrag(e.clientX);
});

// Touch support for Split Slider
dom.splitViewContainer.addEventListener('touchstart', (e) => {
  if (e.touches.length > 0) {
    isDraggingSplit = true;
    handleSplitDrag(e.touches[0].clientX);
  }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (!isDraggingSplit || e.touches.length === 0) return;
  handleSplitDrag(e.touches[0].clientX);
}, { passive: true });

window.addEventListener('touchend', () => {
  isDraggingSplit = false;
});

// Toggle Split Mode: Original ⇋ Stego vs Original ⇋ Diff Heatmap
dom.btnToggleSplitMode.addEventListener('click', (e) => {
  e.stopPropagation();
  state.splitMode = state.splitMode === 'stego' ? 'diff' : 'stego';
  if (state.splitMode === 'diff') {
    dom.splitModeText.textContent = 'Mode: Original ⇋ Diff Heatmap';
    showToast('Split slider set to reveal LSB difference heatmap', 'info');
  } else {
    dom.splitModeText.textContent = 'Mode: Original ⇋ Stego';
    showToast('Split slider set to true stego vessel comparison', 'info');
  }
  renderViewport();
});

// Difference Map Interactive Controls
dom.btnDiffBgMode.addEventListener('click', () => {
  state.diffBgMode = state.diffBgMode === 'void' ? 'overlay' : 'void';
  if (state.diffBgMode === 'overlay') {
    dom.btnDiffBgMode.classList.add('active');
    dom.diffBgModeText.textContent = 'Host Vessel Overlay';
    showToast('Difference heatmap blended directly over host vessel', 'info');
  } else {
    dom.btnDiffBgMode.classList.remove('active');
    dom.diffBgModeText.textContent = 'Cosmic Void';
    showToast('Difference heatmap isolated against cosmic void', 'info');
  }
  renderViewport();
});

dom.btnDiffPulse.addEventListener('click', () => {
  state.diffPulse = !state.diffPulse;
  if (state.diffPulse) {
    dom.btnDiffPulse.classList.add('active');
    dom.diffMapImg.classList.add('pulse-active');
    dom.diffPulseText.textContent = 'Pulsing Active';
  } else {
    dom.btnDiffPulse.classList.remove('active');
    dom.diffMapImg.classList.remove('pulse-active');
    dom.diffPulseText.textContent = 'Pulse Weave';
  }
});

// Difference Amplification Slider with instant CSS response & debounced IPC
let ampDebounceTimer = null;
dom.diffAmpSlider.addEventListener('input', (e) => {
  const amp = parseInt(e.target.value, 10);
  dom.ampFactorText.textContent = `${amp}×`;
  state.diffAmpFactor = amp;

  // Immediate CSS feedback for silky smooth 60fps interaction
  const brightness = 0.6 + (amp / 50) * 0.6;
  const contrast = 0.85 + (amp / 50) * 0.65;
  dom.diffMapImg.style.filter = `brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)})`;

  // Debounced IPC call to recalculate sharp bloom/radii
  clearTimeout(ampDebounceTimer);
  ampDebounceTimer = setTimeout(async () => {
    if (state.stegoResult && state.hostImage) {
      try {
        const updateRes = await window.vishantiApi.updateDiffAmp({
          originalBase64: state.hostImage.base64,
          stegoBase64: state.stegoResult.stegoBase64,
          ampFactor: amp
        });
        if (updateRes && updateRes.success) {
          state.stegoResult.diffPreviewUrl = updateRes.diffPreviewUrl;
          dom.diffMapImg.src = updateRes.diffPreviewUrl;
          dom.diffMapImg.style.filter = '';
          // Also update split slider if in diff mode
          if (state.splitMode === 'diff' && state.activeViewportTab === 'split') {
            dom.splitStegoImg.src = updateRes.diffPreviewUrl;
          }
        }
      } catch (err) {}
    }
  }, 60);
});

// Save Sealed Stego Image Action (Strictly PNG or BMP)
dom.btnSaveStego.addEventListener('click', async () => {
  if (!state.stegoResult) return;

  const res = await window.vishantiApi.saveStegoImage({
    format: state.stegoResult.outputFormat,
    dataBase64: state.stegoResult.stegoBase64
  });

  if (res.canceled) return;
  if (res.error) {
    showToast(res.error, 'error');
    return;
  }
  showToast(`Stego artifact saved: ${res.fileName}`, 'success');
});

// ============================================================================
// REVEAL SPELL (EXTRACTION & SILENT FAILURE - B2 & B3)
// ============================================================================
async function processRevealImageFile(file) {
  const name = file.name.toLowerCase();
  if (!name.endsWith('.png') && !name.endsWith('.bmp')) {
    showToast('Vishanti reveal permits only lossless PNG or BMP images.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const arrayBuf = e.target.result;
      const base64 = arrayBufferToBase64(arrayBuf);

      const res = await window.vishantiApi.analyzeImage({
        imageBase64: base64,
        isDual: false
      });

      if (!res.success) {
        showToast(res.error || 'Failed to read stego vessel.', 'error');
        return;
      }

      state.revealImage = {
        fileName: file.name,
        base64: base64,
        width: res.info.width,
        height: res.info.height,
        format: res.info.format.toUpperCase(),
        previewUrl: res.info.previewUrl
      };

      dom.revealDropPrompt.classList.add('hidden');
      dom.revealLoadedInfo.classList.remove('hidden');
      dom.revealThumbImg.src = state.revealImage.previewUrl;
      dom.revealFileName.textContent = state.revealImage.fileName;
      dom.revealDimensions.textContent = `${state.revealImage.width} × ${state.revealImage.height} px`;
      dom.revealFormat.textContent = state.revealImage.format;

      // Reset previous banners
      dom.revealNeutralBanner.classList.add('hidden');
      dom.revealSuccessBanner.classList.add('hidden');

      showToast(`Stego vessel loaded: ${state.revealImage.fileName}`, 'info');
    } catch (err) {
      showToast('Error loading stego image: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

// Reveal drop zone handlers
dom.revealDropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dom.revealDropZone.classList.add('dragover');
});

dom.revealDropZone.addEventListener('dragleave', () => {
  dom.revealDropZone.classList.remove('dragover');
});

dom.revealDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dom.revealDropZone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    processRevealImageFile(e.dataTransfer.files[0]);
  }
});

dom.btnBrowseReveal.addEventListener('click', async (e) => {
  e.stopPropagation();
  if (window.vishantiApi) {
    const res = await window.vishantiApi.openHostImage();
    if (res.canceled) return;
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    state.revealImage = {
      fileName: res.fileName,
      base64: res.fileBase64,
      width: res.info.width,
      height: res.info.height,
      format: res.info.format.toUpperCase(),
      previewUrl: res.info.previewUrl
    };

    dom.revealDropPrompt.classList.add('hidden');
    dom.revealLoadedInfo.classList.remove('hidden');
    dom.revealThumbImg.src = state.revealImage.previewUrl;
    dom.revealFileName.textContent = state.revealImage.fileName;
    dom.revealDimensions.textContent = `${state.revealImage.width} × ${state.revealImage.height} px`;
    dom.revealFormat.textContent = state.revealImage.format;

    dom.revealNeutralBanner.classList.add('hidden');
    dom.revealSuccessBanner.classList.add('hidden');
    showToast(`Stego vessel linked: ${state.revealImage.fileName}`, 'info');
  } else {
    dom.revealFileInput.click();
  }
});

dom.revealFileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length > 0) {
    processRevealImageFile(e.target.files[0]);
  }
});

dom.btnChangeReveal.addEventListener('click', (e) => {
  e.stopPropagation();
  state.revealImage = null;
  dom.revealLoadedInfo.classList.add('hidden');
  dom.revealDropPrompt.classList.remove('hidden');
  dom.revealFileInput.value = '';
  dom.revealNeutralBanner.classList.add('hidden');
  dom.revealSuccessBanner.classList.add('hidden');
});

// Reveal Action Button
dom.btnRevealSpell.addEventListener('click', async () => {
  if (!state.revealImage) {
    showToast('Please select a stego image to reveal.', 'error');
    return;
  }

  const password = dom.revealPassword.value || '';
  if (!password.trim()) {
    showToast('Please enter the incantation passphrase.', 'error');
    dom.revealPassword.focus();
    return;
  }

  dom.btnRevealSpell.disabled = true;
  dom.btnRevealSpell.querySelector('.btn-text').textContent = 'Seeking Arcane Resonance...';

  // Hide previous banners
  dom.revealNeutralBanner.classList.add('hidden');
  dom.revealSuccessBanner.classList.add('hidden');
  dom.revealTextBox.classList.add('hidden');
  dom.revealFileBox.classList.add('hidden');

  try {
    const result = await window.vishantiApi.revealSpell({
      stegoImageBase64: state.revealImage.base64,
      password: password
    });

    if (!result.success) {
      // Conforms strictly to B2 & B3: Neutral graceful status ("No incantation detected")
      dom.revealNeutralBanner.classList.remove('hidden');
      return;
    }

    // Success!
    state.extractedSecret = result;
    audio.playRevealResonance();
    dom.revealSuccessBanner.classList.remove('hidden');

    // Display partition info
    let partitionName = 'Master Weave';
    if (result.partitionMode === 'decoy') {
      partitionName = 'Decoy Partition (Set A)';
    } else if (result.partitionMode === 'primary') {
      partitionName = 'True Sanctum Secret (Set B)';
    }
    dom.revealPartitionTag.textContent = partitionName;

    if (result.type === 'text') {
      dom.revealTextBox.classList.remove('hidden');
      dom.revealTextContent.textContent = result.text;
    } else {
      dom.revealFileBox.classList.remove('hidden');
      dom.revealUnsealedFileName.textContent = result.filename || 'unsealed_secret.bin';
      dom.revealUnsealedFileSize.textContent = formatBytes(result.byteLength || 0);
    }

    showToast('Incantation verified! Spell unsealed.', 'success');
  } catch (err) {
    // Fail gracefully with neutral status
    dom.revealNeutralBanner.classList.remove('hidden');
  } finally {
    dom.btnRevealSpell.disabled = false;
    dom.btnRevealSpell.querySelector('.btn-text').textContent = 'Unseal & Reveal Spell';
  }
});

// Copy Secret Text to Clipboard
dom.btnCopySecretText.addEventListener('click', async () => {
  if (state.extractedSecret && state.extractedSecret.text) {
    await navigator.clipboard.writeText(state.extractedSecret.text);
    dom.btnCopySecretText.textContent = '✓ Copied!';
    setTimeout(() => {
      dom.btnCopySecretText.textContent = '📋 Copy Secret';
    }, 2000);
    showToast('Secret text copied to clipboard.', 'success');
  }
});

// Export Extracted Secret File
dom.btnExportSecretFile.addEventListener('click', async () => {
  if (state.extractedSecret && state.extractedSecret.dataBase64) {
    const res = await window.vishantiApi.saveExtractedFile({
      fileName: state.extractedSecret.filename || 'unsealed_scroll.bin',
      dataBase64: state.extractedSecret.dataBase64
    });

    if (res.canceled) return;
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    showToast(`Secret file exported: ${res.savedPath}`, 'success');
  }
});
