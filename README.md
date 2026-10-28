# 🔮 The Vishanti Cipher — Mystic Desktop Steganography

**Conforming Strictly to Softablitz 2026 Rules & Specifications**  
**Tech Stack 3: Electron (JavaScript, Node.js, Native `crypto`, `sharp`, `bmp-js`)**

---

## 🌟 Overview

**The Vishanti Cipher** is an advanced, production-grade desktop steganography application styled with a Doctor Strange Sanctum Sanctorum aesthetic. It implements authenticated encryption, anti-steganalysis embedding techniques, real-time capacity monitoring, and cryptographic plausible deniability.

---

## 📐 Softablitz 2026 Compliance Matrix

| Requirement | Specification | Implementation in The Vishanti Cipher |
| :--- | :--- | :--- |
| **B1** | **Cross-Platform Desktop UI** | Modern Electron app with two dedicated views: **"Seal Spell"** (Embed) & **"Reveal Spell"** (Extract). Includes drag-and-drop file upload, live visual previews of Original vs. Stego, an interactive **Split Comparison Slider**, and an amplified **Difference Map Heatmap Overlay** with 1×–100× magnification slider. |
| **B2** | **Cryptographic Concealment** | Authenticated **AES-256-GCM** with 128-bit authentication tags and key derivation using **PBKDF2-HMAC-SHA256** (100,000 iterations + 16-byte cryptographically secure salt). All header length fields and payloads are authenticated and indistinguishable from random noise. |
| **B3** | **Silent Failures** | Fails gracefully with neutral status (`"No incantation detected in the mystic weave."`) on incorrect passwords, un-steganographed images, or corrupted bits. Zero technical errors, exceptions, or timing traces leaked to adversaries. |
| **B4** | **Capacity Engine** | Real-time formulaic calculation: `Capacity = ((Width * Height * 3) / 8) - headerOverhead`. Features a live dynamic capacity gauge with real-time payload consumption tracking and overflow warnings. |
| **B5** | **Lossless Formats** | Strictly enforces lossless **PNG** and **BMP** format usage for both input host vessels and exported stego artifacts. Lossy formats (JPEG/WebP) are rejected to prevent lossy compression artifact corruption. |
| **A1** | **Anti-Steganalysis & Seeded Scattering** | Deterministic CSPRNG (HMAC-SHA256 + AES-256-CTR) derives uniform pseudo-random pixel channel coordinates across the image from the user's password. Implements **LSB Matching (±1 embedding)** instead of naive LSB replacement, preserving pairwise value distributions to completely defeat **Chi-square** and **RS steganalysis** attacks. |
| **A2** | **Plausible Deniability (Multi-Payload)** | Allows embedding **two disjoint secrets** (Primary true secret + Decoy cover secret) inside the same image. Uses independent password seeds mapped onto **collision-free coordinate sets** (Even channel lattice $2k$ vs. Odd channel lattice $2k+1$). Coercion resistance: revealing the Decoy password unlocks only the Decoy message with zero mathematical trace of the Primary secret. |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+ or v24+)
- **npm** (v9+)

### 2. Launch the Application
```bash
npm start
```
*Or directly via Electron:*
```bash
npx electron .
```

### 3. Run the Automated Verification Suite
Run the 1,028-assertion automated test suite verifying every cryptographic, capacity, LSB matching, and plausible deniability guarantee:
```bash
node testSuite.js
```

---

## 🏛️ Application Architecture & File Tree

```
SOFTABLITZ-26/
├── assets/
│   ├── icon.png                 # Mystic mandala desktop icon
│   └── sample_host.png          # Sample 600x400 lossless host canvas
├── .gitignore                   # Git exclusion rules
├── cryptoStegoEngine.js         # Core Cryptographic & Steganography Engine
├── generateAssets.js            # Asset Generation Helper
├── index.html                   # Sanctum Sanctorum Desktop UI Layout
├── main.js                      # Electron Main Process & Secure IPC Handlers
├── package.json                 # Project Manifest & Dependencies
├── package-lock.json            # Locked dependency tree
├── preload.js                   # Secure ContextBridge IPC API (window.vishantiApi)
├── README.md                    # Project Documentation
├── renderer.js                  # Frontend Controller, State Machine & Difference Map
├── styles.css                   # Glassmorphic Design System, Runes & Animations
├── testSuite.js                 # Automated Verification Suite (1,028 Assertions)
└── vishantiVisuals.js           # Cosmic Canvas Particles & Procedural Audio FX
```

---

## 🔮 Usage Guide

### 1. "Seal Spell" (Embed Mode)
1. **Host Canvas**: Drag and drop a PNG or BMP image into the host dropzone (or click Browse).
2. **Mystic Capacity**: Observe the live capacity gauge showing maximum usable bytes according to `((W * H * 3) / 8) - Overhead`.
3. **Plausible Deniability (Optional)**:
   - Toggle the switch to activate **Dual-Payload Mode**.
   - Inscribe a harmless **Decoy Spell** + **Decoy Incantation**.
   - Inscribe the confidential **Sanctum Secret** + **Master Incantation**.
4. **Output Format**: Choose **Lossless PNG** (compressed) or **Lossless BMP** (uncompressed bitmap).
5. **Weave Spell**: Click **"Weave & Seal Spell"**.
6. **Inspect**: Use the **Split Slider** or **Difference Map** (with live amplification slider) to visually inspect the seeded ±1 modifications.
7. **Save**: Click **"Save Sealed Stego Artifact"** to export to disk.

### 2. "Reveal Spell" (Extract Mode)
1. Drag and drop any sealed PNG or BMP image.
2. Enter the incantation password.
3. Click **"Unseal & Reveal Spell"**.
4. If the incantation matches:
   - If Decoy password is entered $\rightarrow$ reveals Decoy secret!
   - If Master password is entered $\rightarrow$ reveals Master true secret!
   - Text can be copied via the **"Copy Secret"** button; files can be exported via **"Export Unsealed File"**.
5. If the password is wrong or no stego weave is present:
   - Displays neutral status: **"No incantation detected"** with zero leakage.
