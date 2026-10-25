/**
 * ============================================================================
 * THE VISHANTI CIPHER - CRYPTOGRAPHIC STEGANOGRAPHY ENGINE
 * Conforming strictly to Softablitz 2026 Rules & Specifications
 * ============================================================================
 * - B1: Cross-platform engine for Electron desktop UI
 * - B2 & B3: AES-256-GCM + PBKDF2-HMAC-SHA256 with Silent Graceful Failures
 * - B4 & B5: Real-time Capacity Engine & Strictly Lossless Formats (PNG / BMP)
 * - A1: Anti-Steganalysis via Seeded Scattering & LSB Matching (±1 embedding)
 * - A2: Plausible Deniability (Multi-Payload with Collision-Free Coordinate Sets)
 * ============================================================================
 */

const crypto = require('crypto');
const sharp = require('sharp');
const bmp = require('bmp-js');
const fs = require('fs');
const path = require('path');

// Cryptographic and Framing Constants
const PBKDF2_ROUNDS = 100000;
const SALT_LEN = 16;
const IV_LEN = 12;
const TAG_LEN = 16;
const MAGIC_BYTES = Buffer.from('VISHANTI', 'utf8'); // 8-byte framing magic
const HEADER_OVERHEAD = 128; // Header overhead in bytes for capacity calculation

/**
 * Deterministic Cryptographic Pseudo-Random Number Generator (CSPRNG)
 * Derives a keystream from the user's password using HMAC-SHA256 and AES-256-CTR.
 * 
 * @param {string} password - Incantation password
 * @param {string} domain - Domain separation string
 * @returns {object} PRNG object with nextBytes and nextInt methods
 */
function createDeterministicPrng(password, domain = 'VISHANTI_SCATTER_PRNG_V1') {
  const seed = crypto.createHmac('sha256', Buffer.from(password, 'utf8'))
    .update(Buffer.from(domain, 'utf8'))
    .digest();

  const zeroIv = Buffer.alloc(16, 0);
  const cipher = crypto.createCipheriv('aes-256-ctr', seed, zeroIv);
  let internalBuffer = Buffer.alloc(0);
  const emptyBlock = Buffer.alloc(4096, 0);

  function nextBytes(count) {
    while (internalBuffer.length < count) {
      const generated = cipher.update(emptyBlock);
      internalBuffer = Buffer.concat([internalBuffer, generated]);
    }
    const chunk = internalBuffer.subarray(0, count);
    internalBuffer = internalBuffer.subarray(count);
    return chunk;
  }

  /**
   * Generates an unbiased integer in range [0, max - 1] using rejection sampling.
   * Eliminates modulo bias completely.
   */
  function nextInt(max) {
    if (max <= 1) return 0;
    const threshold = 0xFFFFFFFF - (0xFFFFFFFF % max);
    while (true) {
      const chunk = nextBytes(4);
      const val = chunk.readUInt32BE(0);
      if (val < threshold) {
        return val % max;
      }
    }
  }

  return { nextBytes, nextInt };
}

/**
 * Generate pseudo-random coordinate channel indices across the image.
 * Uses a sparse partial Fisher-Yates shuffle with O(M) memory for ultra-fast,
 * deterministic scattering without spatial clustering.
 *
 * @param {object} prng - Deterministic PRNG
 * @param {number} bitCount - Number of coordinate bits needed
 * @param {number} totalRgbChannels - Total available RGB channel slots (W * H * 3)
 * @param {string} partitionMode - 'full' | 'decoy' | 'primary'
 * @param {object} state - Stateful mapping for continuous bit stream generation
 * @returns {number[]} Array of absolute buffer offsets
 */
function getScatteredCoordinates(prng, bitCount, totalRgbChannels, partitionMode = 'full', state = null) {
  let totalSlots;
  if (partitionMode === 'decoy') {
    totalSlots = Math.floor(totalRgbChannels / 2);
  } else if (partitionMode === 'primary') {
    totalSlots = Math.floor((totalRgbChannels - 1) / 2);
  } else {
    totalSlots = totalRgbChannels;
  }

  if (bitCount > totalSlots) {
    throw new Error(`Spell requires ${bitCount} bits, exceeding partition capacity of ${totalSlots} bits.`);
  }

  const table = state ? state.table : new Map();
  const startIndex = state ? state.index : 0;
  const coordinates = new Array(bitCount);

  for (let i = 0; i < bitCount; i++) {
    const curI = startIndex + i;
    const remainingRange = totalSlots - curI;
    if (remainingRange <= 0) {
      throw new Error('Exhausted available coordinate slots during scattering.');
    }

    const randOffset = prng.nextInt(remainingRange);
    const j = curI + randOffset;

    const valI = table.has(curI) ? table.get(curI) : curI;
    const valJ = table.has(j) ? table.get(j) : j;

    let realOffset;
    if (partitionMode === 'decoy') {
      // Disjoint Partition A: Even channel offsets (0, 2, 4, 6...)
      realOffset = valJ * 2;
    } else if (partitionMode === 'primary') {
      // Disjoint Partition B: Odd channel offsets (1, 3, 5, 7...)
      realOffset = valJ * 2 + 1;
    } else {
      // Full image space
      realOffset = valJ;
    }

    coordinates[i] = realOffset;

    // Record Fisher-Yates swap and garbage-collect completed index to preserve memory
    table.set(j, valI);
    table.delete(curI);
  }

  if (state) {
    state.index = startIndex + bitCount;
  }

  return coordinates;
}

/**
 * LSB Matching (±1 Embedding) Engine.
 * Instead of raw LSB replacement (which distorts Pairs of Values and is easily
 * detected by Chi-square and RS steganalysis), LSB Matching adjusts mismatched
 * bytes by either +1 or -1 pseudo-randomly while respecting boundary constraints.
 * 
 * @param {Buffer} rawRgbBuffer - Mutable RGB raw buffer
 * @param {number[]} coordinates - Target coordinate indices
 * @param {Buffer} bitDataBuffer - Bytes to embed
 * @param {object} prng - Deterministic PRNG for ±1 direction selection
 */
function embedBitsLsbMatching(rawRgbBuffer, coordinates, bitDataBuffer, prng) {
  const totalBits = bitDataBuffer.length * 8;
  for (let i = 0; i < totalBits; i++) {
    const targetBit = (bitDataBuffer[i >> 3] >> (7 - (i & 7))) & 1;
    const offset = coordinates[i];
    let val = rawRgbBuffer[offset];

    if ((val & 1) !== targetBit) {
      if (val === 0) {
        val = 1;
      } else if (val === 255) {
        val = 254;
      } else {
        // Pseudo-randomly pick +1 or -1 direction to diffuse histogram transitions
        const direction = (prng.nextInt(2) === 0) ? 1 : -1;
        val += direction;
      }
      rawRgbBuffer[offset] = val;
    }
  }
}

/**
 * Extract bits from coordinates and reconstruct byte buffer.
 * Extraction is seamless: (val & 1) always retrieves the embedded bit,
 * regardless of whether +1 or -1 was applied during embedding!
 *
 * @param {Buffer} rawRgbBuffer - RGB buffer
 * @param {number[]} coordinates - Target coordinate indices
 * @returns {Buffer} Extracted byte buffer
 */
function extractBits(rawRgbBuffer, coordinates) {
  const byteCount = Math.floor(coordinates.length / 8);
  const result = Buffer.alloc(byteCount, 0);
  for (let i = 0; i < coordinates.length; i++) {
    const bit = rawRgbBuffer[coordinates[i]] & 1;
    result[i >> 3] |= (bit << (7 - (i & 7)));
  }
  return result;
}

/**
 * Lossless Image Decoding Engine.
 * Conforms strictly to B5 by reading only lossless PNG and BMP images.
 * Rejects lossy compression formats (e.g., JPEG).
 *
 * @param {Buffer|string} input - Image buffer or filesystem path
 * @returns {Promise<object>} { rawRgb: Buffer, width: number, height: number, format: 'png'|'bmp' }
 */
async function loadLosslessImage(input) {
  let fileBuffer;
  if (typeof input === 'string') {
    fileBuffer = await fs.promises.readFile(input);
  } else if (Buffer.isBuffer(input)) {
    fileBuffer = input;
  } else {
    throw new Error('Invalid image input: expected file path or Buffer.');
  }

  if (fileBuffer.length < 8) {
    throw new Error('Image file is corrupted or too small.');
  }

  // BMP Signature: 'BM' (0x42, 0x4D)
  if (fileBuffer[0] === 0x42 && fileBuffer[1] === 0x4D) {
    const decodedBmp = bmp.decode(fileBuffer);
    const pixelCount = decodedBmp.width * decodedBmp.height;
    const rawRgb = Buffer.alloc(pixelCount * 3);

    // bmp-js decodes into 32-bit ABGR format (data[i]=A, data[i+1]=B, data[i+2]=G, data[i+3]=R)
    for (let i = 0, j = 0; i < decodedBmp.data.length; i += 4, j += 3) {
      rawRgb[j] = decodedBmp.data[i + 3];     // R
      rawRgb[j + 1] = decodedBmp.data[i + 2]; // G
      rawRgb[j + 2] = decodedBmp.data[i + 1]; // B
    }

    return {
      rawRgb,
      width: decodedBmp.width,
      height: decodedBmp.height,
      format: 'bmp'
    };
  }

  // PNG Signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  const isPng = (
    fileBuffer[0] === 0x89 &&
    fileBuffer[1] === 0x50 &&
    fileBuffer[2] === 0x4E &&
    fileBuffer[3] === 0x47
  );

  if (!isPng) {
    throw new Error('Unsupported format: Vishanti Cipher strictly permits only lossless PNG or BMP host images.');
  }

  const sharpInstance = sharp(fileBuffer);
  const rawObj = await sharpInstance
    .removeAlpha()
    .toColorspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    rawRgb: rawObj.data,
    width: rawObj.info.width,
    height: rawObj.info.height,
    format: 'png'
  };
}

/**
 * Lossless Image Export Engine.
 * Encodes raw RGB buffer strictly into lossless PNG or BMP.
 *
 * @param {Buffer} rawRgb - 3-channel RGB buffer
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} format - 'png' | 'bmp'
 * @returns {Promise<Buffer>} Lossless encoded image buffer
 */
async function exportLosslessImage(rawRgb, width, height, format = 'png') {
  if (format.toLowerCase() === 'bmp') {
    const abgrBuffer = Buffer.alloc(width * height * 4);
    for (let i = 0, j = 0; j < rawRgb.length; i += 4, j += 3) {
      abgrBuffer[i] = 255;             // Alpha
      abgrBuffer[i + 1] = rawRgb[j + 2]; // Blue
      abgrBuffer[i + 2] = rawRgb[j + 1]; // Green
      abgrBuffer[i + 3] = rawRgb[j];     // Red
    }
    const bmpData = bmp.encode({ data: abgrBuffer, width, height });
    return bmpData.data;
  }

  // Lossless PNG with maximum compression
  return await sharp(rawRgb, {
    raw: { width, height, channels: 3 }
  })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

/**
 * Capacity Engine:
 * Real-time calculation: Capacity = ((Width * Height * 3) / 8) - headerOverhead.
 *
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {boolean} isDual - Whether plausible deniability mode is active
 * @returns {object} Detailed capacity analysis
 */
function calculateCapacity(width, height, isDual = false) {
  const totalRgbChannels = width * height * 3;
  const totalBytes = Math.floor(totalRgbChannels / 8);

  if (!isDual) {
    const singleMax = Math.max(0, totalBytes - HEADER_OVERHEAD);
    return {
      mode: 'single',
      width,
      height,
      totalChannels: totalRgbChannels,
      maxPayloadBytes: singleMax,
      headerOverheadBytes: HEADER_OVERHEAD
    };
  } else {
    // In dual payload mode, image space is partitioned equally (even and odd offsets)
    const partitionChannels = Math.floor(totalRgbChannels / 2);
    const partitionBytes = Math.floor(partitionChannels / 8);
    const maxPerPartition = Math.max(0, partitionBytes - HEADER_OVERHEAD);

    return {
      mode: 'dual',
      width,
      height,
      totalChannels: totalRgbChannels,
      primaryMaxPayloadBytes: maxPerPartition,
      decoyMaxPayloadBytes: maxPerPartition,
      headerOverheadBytes: HEADER_OVERHEAD
    };
  }
}

/**
 * Pack and encrypt payload using AES-256-GCM + PBKDF2-HMAC-SHA256.
 * Encrypts both the length header and payload body with authenticated tags.
 *
 * @param {object} payload - { type: 'text'|'file', text?: string, filename?: string, data?: Buffer }
 * @param {string} password - Incantation key
 * @returns {object} Encrypted blocks and total byte count
 */
function packAndEncryptPayload(payload, password) {
  const isFile = payload.type === 'file';
  const typeByte = isFile ? 0x02 : 0x01;
  const filenameBuffer = Buffer.from(payload.filename || '', 'utf8');

  let dataBuffer;
  if (Buffer.isBuffer(payload.data)) {
    dataBuffer = payload.data;
  } else if (typeof payload.text === 'string') {
    dataBuffer = Buffer.from(payload.text, 'utf8');
  } else {
    dataBuffer = Buffer.alloc(0);
  }

  // Construct Inner Framing: [MAGIC 8B] [Type 1B] [FnLen 2B] [Fn UTF-8] [DataLen 4B] [Data]
  const innerFraming = Buffer.concat([
    MAGIC_BYTES,
    Buffer.from([typeByte]),
    Buffer.alloc(2),
    filenameBuffer,
    Buffer.alloc(4),
    dataBuffer
  ]);

  innerFraming.writeUInt16BE(filenameBuffer.length, 9);
  innerFraming.writeUInt32BE(dataBuffer.length, 11 + filenameBuffer.length);

  // Cryptographic Key Derivation
  const salt = crypto.randomBytes(SALT_LEN);
  const iv = crypto.randomBytes(IV_LEN);
  const key = crypto.pbkdf2Sync(password, salt, PBKDF2_ROUNDS, 32, 'sha256');

  // Encrypt Inner Payload
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(innerFraming), cipher.final()]);
  const dataTag = cipher.getAuthTag();

  // Encrypt Payload Length Header with independent IV
  const headerIv = crypto.createHmac('sha256', iv)
    .update(Buffer.from('VISHANTI_HDR_IV_V1', 'utf8'))
    .digest()
    .subarray(0, 12);

  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(ciphertext.length, 0);

  const headerCipher = crypto.createCipheriv('aes-256-gcm', key, headerIv);
  const encryptedLength = Buffer.concat([headerCipher.update(lengthBuf), headerCipher.final()]);
  const headerTag = headerCipher.getAuthTag();

  // Header Block: [Salt: 16B] [IV: 12B] [EncLength: 4B] [HeaderTag: 16B] = 48 bytes (384 bits)
  const headerBlock = Buffer.concat([salt, iv, encryptedLength, headerTag]);
  // Body Block: [Ciphertext: N B] [DataTag: 16B]
  const bodyBlock = Buffer.concat([ciphertext, dataTag]);

  return {
    headerBlock,
    bodyBlock,
    totalBytes: headerBlock.length + bodyBlock.length
  };
}

/**
 * Decrypt and unpack payload from raw RGB buffer for a given partition mode.
 * Conforms strictly to B2 & B3: Fails gracefully without throwing uncaught errors.
 *
 * @param {Buffer} rawRgb - Image raw RGB buffer
 * @param {string} password - Incantation password
 * @param {string} partitionMode - 'full' | 'primary' | 'decoy'
 * @returns {object|null} Decrypted secret or null if no valid incantation
 */
function decryptAndUnpackPartition(rawRgb, password, partitionMode) {
  try {
    const prng = createDeterministicPrng(password);
    const prngState = { table: new Map(), index: 0 };

    // 1. Extract 48-byte header block (384 bits)
    const headerCoords = getScatteredCoordinates(prng, 48 * 8, rawRgb.length, partitionMode, prngState);
    const headerBlock = extractBits(rawRgb, headerCoords);

    const salt = headerBlock.subarray(0, 16);
    const iv = headerBlock.subarray(16, 28);
    const encryptedLength = headerBlock.subarray(28, 32);
    const headerTag = headerBlock.subarray(32, 48);

    // Key Derivation
    const key = crypto.pbkdf2Sync(password, salt, PBKDF2_ROUNDS, 32, 'sha256');
    const headerIv = crypto.createHmac('sha256', iv)
      .update(Buffer.from('VISHANTI_HDR_IV_V1', 'utf8'))
      .digest()
      .subarray(0, 12);

    // Authenticated Decryption of Length Header
    const lenDecipher = crypto.createDecipheriv('aes-256-gcm', key, headerIv);
    lenDecipher.setAuthTag(headerTag);
    const decryptedLenBuf = Buffer.concat([lenDecipher.update(encryptedLength), lenDecipher.final()]);
    const ciphertextLength = decryptedLenBuf.readUInt32BE(0);

    // Sanity check length against buffer bounds
    if (ciphertextLength <= 0 || ciphertextLength > rawRgb.length) {
      return null;
    }

    // 2. Extract Body Block (ciphertext + 16-byte GCM Tag)
    const bodyCoords = getScatteredCoordinates(
      prng,
      (ciphertextLength + TAG_LEN) * 8,
      rawRgb.length,
      partitionMode,
      prngState
    );
    const bodyBlock = extractBits(rawRgb, bodyCoords);

    const ciphertext = bodyBlock.subarray(0, ciphertextLength);
    const dataTag = bodyBlock.subarray(ciphertextLength, ciphertextLength + TAG_LEN);

    // Authenticated Decryption of Body
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(dataTag);
    const innerFraming = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    // Verify Vishanti Magic Header
    if (!innerFraming.subarray(0, 8).equals(MAGIC_BYTES)) {
      return null;
    }

    const typeByte = innerFraming[8];
    const isFile = typeByte === 0x02;
    const fnLen = innerFraming.readUInt16BE(9);
    const filename = innerFraming.subarray(11, 11 + fnLen).toString('utf8');
    const dataLen = innerFraming.readUInt32BE(11 + fnLen);
    const dataBuffer = innerFraming.subarray(15 + fnLen, 15 + fnLen + dataLen);

    return {
      success: true,
      partitionMode,
      type: isFile ? 'file' : 'text',
      filename: isFile ? filename : null,
      text: !isFile ? dataBuffer.toString('utf8') : null,
      data: dataBuffer,
      byteLength: dataBuffer.length
    };
  } catch (err) {
    // Graceful silent failure on wrong password or corrupt payload
    return null;
  }
}

/**
 * Generate High-Contrast Amplified Difference Heatmap and Image Metrics.
 *
 * @param {Buffer} originalRgb - Original pristine RGB buffer
 * @param {Buffer} stegoRgb - Modified stego RGB buffer
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} ampFactor - Visual amplification multiplier (e.g., 50)
 * @returns {Promise<object>} Visual PNG data and metrics
 */
async function generateDifferenceMap(originalRgb, stegoRgb, width, height, ampFactor = 50) {
  const totalPixels = width * height;
  const diffRgba = Buffer.alloc(totalPixels * 4);

  let modifiedPixels = 0;
  let totalChannelDiff = 0;
  let mseSum = 0;

  // Initialize dark cosmic void (#080a14)
  for (let i = 0; i < diffRgba.length; i += 4) {
    diffRgba[i] = 8;
    diffRgba[i + 1] = 10;
    diffRgba[i + 2] = 20;
    diffRgba[i + 3] = 255;
  }

  const modifiedCoords = [];

  for (let p = 0; p < totalPixels; p++) {
    const j = p * 3;
    const dr = Math.abs(stegoRgb[j] - originalRgb[j]);
    const dg = Math.abs(stegoRgb[j + 1] - originalRgb[j + 1]);
    const db = Math.abs(stegoRgb[j + 2] - originalRgb[j + 2]);
    const diff = dr + dg + db;

    mseSum += (dr * dr + dg * dg + db * db);

    if (diff > 0) {
      modifiedPixels++;
      totalChannelDiff += diff;
      const x = p % width;
      const y = Math.floor(p / width);
      modifiedCoords.push({ p, x, y, dr, dg, db, diff });
    }
  }

  // Dynamic visual amplification curve:
  // ampFactor ranges from 1 to 100 (default 50)
  // At 1x: Faint, true-to-life imperceptible level (proves LSB stealth)
  // At 25x: Moderate amber glow
  // At 50x: Radiant solar gold (#ffaa1d)
  // At 75x+: High-intensity astral bloom with halo expansion
  const clampedAmp = Math.max(1, Math.min(100, Number(ampFactor) || 50));
  const intensity = clampedAmp / 50; // 0.02 to 2.0

  for (const { p, x, y, dr, dg, db } of modifiedCoords) {
    const i = p * 4;
    // Core pixel intensity proportional to amplification
    const rVal = Math.min(255, Math.round(15 + (dr > 0 ? 240 : 180) * Math.min(1, intensity)));
    const gVal = Math.min(255, Math.round(15 + (dg > 0 ? 210 : 150) * Math.min(1, intensity)));
    const bVal = Math.min(255, Math.round(25 + (db > 0 ? 180 : 40) * Math.min(1, intensity)));

    diffRgba[i] = rVal;
    diffRgba[i + 1] = gVal;
    diffRgba[i + 2] = bVal;
    diffRgba[i + 3] = 255;

    // For ampFactor > 50, expand celestial aura into neighbors
    if (clampedAmp > 50) {
      const auraRatio = (clampedAmp - 50) / 50; // 0 to 1
      const auraR = Math.round(rVal * 0.55 * auraRatio);
      const auraG = Math.round(gVal * 0.45 * auraRatio);
      const auraB = Math.round(bVal * 0.35 * auraRatio);

      const neighbors = [
        { nx: x - 1, ny: y },
        { nx: x + 1, ny: y },
        { nx: x, ny: y - 1 },
        { nx: x, ny: y + 1 }
      ];

      if (clampedAmp >= 80) {
        neighbors.push(
          { nx: x - 1, ny: y - 1 },
          { nx: x + 1, ny: y - 1 },
          { nx: x - 1, ny: y + 1 },
          { nx: x + 1, ny: y + 1 }
        );
      }

      for (const { nx, ny } of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const ni = (ny * width + nx) * 4;
          if (diffRgba[ni] < auraR) {
            diffRgba[ni] = Math.max(diffRgba[ni], auraR);
            diffRgba[ni + 1] = Math.max(diffRgba[ni + 1], auraG);
            diffRgba[ni + 2] = Math.max(diffRgba[ni + 2], auraB);
          }
        }
      }
    }
  }

  const mse = mseSum / (totalPixels * 3);
  const psnr = mse === 0 ? Infinity : (10 * Math.log10((255 * 255) / mse));
  const modifiedPercent = ((modifiedPixels / totalPixels) * 100).toFixed(4);

  const diffPngBuffer = await sharp(diffRgba, {
    raw: { width, height, channels: 4 }
  }).png().toBuffer();

  return {
    diffPngBuffer,
    diffPngBase64: `data:image/png;base64,${diffPngBuffer.toString('base64')}`,
    stats: {
      totalPixels,
      modifiedPixels,
      modifiedPercent,
      totalChannelDiff,
      mse: mse.toFixed(6),
      psnr: psnr === Infinity ? 'Infinite (Pristine)' : `${psnr.toFixed(2)} dB`
    }
  };
}

/**
 * Main "Seal Spell" (Embed) API.
 * Supports Single Payload or Plausible Deniability Dual-Payloads with
 * independent seeds and collision-free coordinate sets.
 *
 * @param {object} params - Embedding configuration
 * @returns {Promise<object>} Stego image buffer, diff map, statistics, and metadata
 */
async function sealSpell(params) {
  const {
    hostImage, // Buffer or file path
    isDualPayload = false,
    primaryPayload,
    primaryPassword,
    decoyPayload,
    decoyPassword,
    outputFormat = 'png'
  } = params;

  if (!primaryPassword || primaryPassword.trim().length === 0) {
    throw new Error('Primary incantation password is required.');
  }

  // 1. Load host image (strict lossless validation)
  const imageObj = await loadLosslessImage(hostImage);
  const { width, height, rawRgb } = imageObj;
  const stegoRgb = Buffer.from(rawRgb); // Clone buffer for modification

  // 2. Compute Capacity & Verify Constraints
  const capacityInfo = calculateCapacity(width, height, isDualPayload);

  if (!isDualPayload) {
    // Single Payload Mode
    const primaryPkt = packAndEncryptPayload(primaryPayload, primaryPassword);
    if (primaryPkt.totalBytes > capacityInfo.maxPayloadBytes + HEADER_OVERHEAD) {
      throw new Error(
        `Payload size (${primaryPkt.totalBytes} bytes) exceeds mystic capacity (${capacityInfo.maxPayloadBytes} bytes).`
      );
    }

    const prng = createDeterministicPrng(primaryPassword);
    const prngState = { table: new Map(), index: 0 };

    const hdrCoords = getScatteredCoordinates(prng, primaryPkt.headerBlock.length * 8, stegoRgb.length, 'full', prngState);
    const bodyCoords = getScatteredCoordinates(prng, primaryPkt.bodyBlock.length * 8, stegoRgb.length, 'full', prngState);

    embedBitsLsbMatching(stegoRgb, hdrCoords, primaryPkt.headerBlock, prng);
    embedBitsLsbMatching(stegoRgb, bodyCoords, primaryPkt.bodyBlock, prng);
  } else {
    // Plausible Deniability Mode (Multi-Payload with Disjoint Coordinate Sets)
    if (!decoyPassword || decoyPassword.trim().length === 0) {
      throw new Error('Decoy incantation password is required for Plausible Deniability mode.');
    }

    const primaryPkt = packAndEncryptPayload(primaryPayload, primaryPassword);
    const decoyPkt = packAndEncryptPayload(decoyPayload, decoyPassword);

    const maxAllowed = capacityInfo.primaryMaxPayloadBytes + HEADER_OVERHEAD;
    if (primaryPkt.totalBytes > maxAllowed) {
      throw new Error(`Primary payload exceeds partition capacity of ${capacityInfo.primaryMaxPayloadBytes} bytes.`);
    }
    if (decoyPkt.totalBytes > maxAllowed) {
      throw new Error(`Decoy payload exceeds partition capacity of ${capacityInfo.decoyMaxPayloadBytes} bytes.`);
    }

    // Embed Decoy into Disjoint Partition A (Even Channel Offsets)
    const decoyPrng = createDeterministicPrng(decoyPassword);
    const decoyState = { table: new Map(), index: 0 };
    const decoyHdrCoords = getScatteredCoordinates(decoyPrng, decoyPkt.headerBlock.length * 8, stegoRgb.length, 'decoy', decoyState);
    const decoyBodyCoords = getScatteredCoordinates(decoyPrng, decoyPkt.bodyBlock.length * 8, stegoRgb.length, 'decoy', decoyState);
    embedBitsLsbMatching(stegoRgb, decoyHdrCoords, decoyPkt.headerBlock, decoyPrng);
    embedBitsLsbMatching(stegoRgb, decoyBodyCoords, decoyPkt.bodyBlock, decoyPrng);

    // Embed Primary into Disjoint Partition B (Odd Channel Offsets)
    const primaryPrng = createDeterministicPrng(primaryPassword);
    const primaryState = { table: new Map(), index: 0 };
    const primaryHdrCoords = getScatteredCoordinates(primaryPrng, primaryPkt.headerBlock.length * 8, stegoRgb.length, 'primary', primaryState);
    const primaryBodyCoords = getScatteredCoordinates(primaryPrng, primaryPkt.bodyBlock.length * 8, stegoRgb.length, 'primary', primaryState);
    embedBitsLsbMatching(stegoRgb, primaryHdrCoords, primaryPkt.headerBlock, primaryPrng);
    embedBitsLsbMatching(stegoRgb, primaryBodyCoords, primaryPkt.bodyBlock, primaryPrng);
  }

  // 3. Export lossless stego image
  const stegoBuffer = await exportLosslessImage(stegoRgb, width, height, outputFormat);

  // 4. Generate visual difference heatmap and metrics
  const diffResult = await generateDifferenceMap(rawRgb, stegoRgb, width, height);

  // 5. Generate Preview Data URLs
  const originalPngBuffer = await exportLosslessImage(rawRgb, width, height, 'png');
  const stegoPngBuffer = (outputFormat.toLowerCase() === 'png')
    ? stegoBuffer
    : await exportLosslessImage(stegoRgb, width, height, 'png');

  return {
    success: true,
    stegoBuffer,
    outputFormat: outputFormat.toLowerCase(),
    originalPreviewUrl: `data:image/png;base64,${originalPngBuffer.toString('base64')}`,
    stegoPreviewUrl: `data:image/png;base64,${stegoPngBuffer.toString('base64')}`,
    diffPreviewUrl: diffResult.diffPngBase64,
    stats: diffResult.stats,
    dimensions: { width, height }
  };
}

/**
 * Main "Reveal Spell" (Extract) API.
 * Conforms strictly to B2 & B3:
 * Silent graceful failure returning neutral status ("No incantation detected")
 * on wrong password, corrupt payload, or missing stego weave.
 *
 * @param {object} params - Extraction parameters
 * @returns {Promise<object>} Result payload or neutral failure status
 */
async function revealSpell(params) {
  const { stegoImage, password } = params;

  if (!password || password.trim().length === 0) {
    return {
      success: false,
      message: 'No incantation detected in the mystic weave.'
    };
  }

  try {
    const imageObj = await loadLosslessImage(stegoImage);
    const { rawRgb } = imageObj;

    // Test Partition Modes in deterministic order:
    // 1. Full image mode (single payload)
    let secret = decryptAndUnpackPartition(rawRgb, password, 'full');

    // 2. Primary partition mode (plausible deniability partition B)
    if (!secret) {
      secret = decryptAndUnpackPartition(rawRgb, password, 'primary');
    }

    // 3. Decoy partition mode (plausible deniability partition A)
    if (!secret) {
      secret = decryptAndUnpackPartition(rawRgb, password, 'decoy');
    }

    if (secret && secret.success) {
      return {
        success: true,
        message: 'Incantation verified! Spell unsealed.',
        partitionMode: secret.partitionMode,
        type: secret.type,
        filename: secret.filename,
        text: secret.text,
        dataBase64: secret.data.toString('base64'),
        byteLength: secret.byteLength
      };
    }

    // Silent Graceful Neutral Status on wrong password / missing payload
    return {
      success: false,
      message: 'No incantation detected in the mystic weave.'
    };
  } catch (err) {
    // Catch-all silent failure
    return {
      success: false,
      message: 'No incantation detected in the mystic weave.'
    };
  }
}

/**
 * Get Image Information and Capacity Metrics for Host Image.
 *
 * @param {Buffer|string} input - Host image
 * @returns {Promise<object>} Dimensions and capacity
 */
async function getImageInfo(input) {
  const imageObj = await loadLosslessImage(input);
  const { width, height, format, rawRgb } = imageObj;
  const singleCap = calculateCapacity(width, height, false);
  const dualCap = calculateCapacity(width, height, true);

  const pngPreview = await exportLosslessImage(rawRgb, width, height, 'png');

  return {
    width,
    height,
    format,
    singleCapacityBytes: singleCap.maxPayloadBytes,
    dualCapacityBytesPerSecret: dualCap.primaryMaxPayloadBytes,
    totalChannels: singleCap.totalChannels,
    previewUrl: `data:image/png;base64,${pngPreview.toString('base64')}`
  };
}

module.exports = {
  sealSpell,
  revealSpell,
  getImageInfo,
  calculateCapacity,
  generateDifferenceMap,
  loadLosslessImage,
  exportLosslessImage,
  createDeterministicPrng,
  getScatteredCoordinates,
  HEADER_OVERHEAD
};
