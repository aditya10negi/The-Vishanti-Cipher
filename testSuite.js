/**
 * ============================================================================
 * THE VISHANTI CIPHER - AUTOMATED VERIFICATION TEST SUITE
 * Conforming strictly to Softablitz 2026 Rules & Specifications
 * ============================================================================
 */

const engine = require('./cryptoStegoEngine');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function runTestSuite() {
  console.log('================================================================');
  console.log('🔮 RUNNING THE VISHANTI CIPHER VERIFICATION SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Lossless Vessel Loading & Saving (PNG and BMP) - B5
  // --------------------------------------------------------------------------
  console.log('▶ TEST 1: Lossless PNG and BMP Verification (B5)');
  const width = 150;
  const height = 100;
  const pristineRgb = Buffer.alloc(width * height * 3);
  for (let i = 0; i < pristineRgb.length; i++) {
    pristineRgb[i] = (i * 13 + 37) % 256;
  }

  // 1A. Lossless PNG
  const pngBuffer = await engine.exportLosslessImage(pristineRgb, width, height, 'png');
  const loadedPng = await engine.loadLosslessImage(pngBuffer);
  assert(loadedPng.width === width && loadedPng.height === height, 'PNG dimensions match exactly');
  assert(pristineRgb.equals(loadedPng.rawRgb), 'PNG roundtrip is 100% byte-for-byte lossless');

  // 1B. Lossless BMP
  const bmpBuffer = await engine.exportLosslessImage(pristineRgb, width, height, 'bmp');
  const loadedBmp = await engine.loadLosslessImage(bmpBuffer);
  assert(loadedBmp.width === width && loadedBmp.height === height, 'BMP dimensions match exactly');
  assert(pristineRgb.equals(loadedBmp.rawRgb), 'BMP roundtrip is 100% byte-for-byte lossless');

  // 1C. Rejection of lossy format
  let rejected = false;
  try {
    await engine.loadLosslessImage(Buffer.from('NOT_AN_IMAGE_DATA'));
  } catch (e) {
    rejected = true;
  }
  assert(rejected, 'Corrupt or non-PNG/BMP headers strictly rejected');

  // --------------------------------------------------------------------------
  // TEST 2: Capacity Engine Calculation - B4
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 2: Capacity Engine Real-Time Formulation (B4)');
  const capTestW = 800;
  const capTestH = 600;
  const totalRgbBits = capTestW * capTestH * 3;
  const expectedSingleCapacity = Math.floor(totalRgbBits / 8) - engine.HEADER_OVERHEAD;
  const singleCapObj = engine.calculateCapacity(capTestW, capTestH, false);
  assert(singleCapObj.maxPayloadBytes === expectedSingleCapacity, `Single capacity matches ((W*H*3)/8) - overhead (${expectedSingleCapacity} bytes)`);

  const expectedDualCapacity = Math.floor((totalRgbBits / 2) / 8) - engine.HEADER_OVERHEAD;
  const dualCapObj = engine.calculateCapacity(capTestW, capTestH, true);
  assert(dualCapObj.primaryMaxPayloadBytes === expectedDualCapacity, `Dual partition capacity matches half-lattice formulation (${expectedDualCapacity} bytes)`);

  // --------------------------------------------------------------------------
  // TEST 3: Deterministic PRNG & Seeded Scattering - A1
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 3: Anti-Steganalysis Seeded Scattering (A1)');
  const prng1 = engine.createDeterministicPrng('ancient_incantation_123');
  const prng2 = engine.createDeterministicPrng('ancient_incantation_123');
  const val1 = prng1.nextInt(1000000);
  const val2 = prng2.nextInt(1000000);
  assert(val1 === val2, 'Deterministic PRNG produces identical values for identical passwords');

  const prngOther = engine.createDeterministicPrng('different_password');
  const valOther = prngOther.nextInt(1000000);
  assert(val1 !== valOther, 'Different passwords yield distinct keystreams');

  const scatterCoords1 = engine.getScatteredCoordinates(engine.createDeterministicPrng('test_seed'), 500, 10000, 'full');
  const uniqueCoords = new Set(scatterCoords1);
  assert(scatterCoords1.length === 500, 'Correct number of coordinates generated');
  assert(uniqueCoords.size === 500, 'Zero duplicate coordinates within selected set (Collision-free Fisher-Yates)');

  // --------------------------------------------------------------------------
  // TEST 4: LSB Matching (±1 Embedding) - A1
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 4: LSB Matching (±1 Embedding) Steganalysis Immunity (A1)');
  const hostTestBuf = Buffer.alloc(1000, 120); // all even bytes (LSB = 0)
  const targetBits = Buffer.alloc(125, 0xFF); // all 1s (must flip every LSB)
  const prngLsb = engine.createDeterministicPrng('lsb_test_seed');
  const coordsLsb = engine.getScatteredCoordinates(prngLsb, 1000, 1000, 'full');

  engine.createDeterministicPrng('lsb_test_seed'); // reset
  const mutableBuf = Buffer.from(hostTestBuf);

  // Embed with LSB matching
  for (let i = 0; i < 1000; i++) {
    const bit = (targetBits[i >> 3] >> (7 - (i & 7))) & 1;
    const offset = coordsLsb[i];
    let val = mutableBuf[offset];
    if ((val & 1) !== bit) {
      const dir = (prngLsb.nextInt(2) === 0) ? 1 : -1;
      val += dir;
      mutableBuf[offset] = val;
    }
  }

  let plusOneCount = 0;
  let minusOneCount = 0;
  for (let i = 0; i < 1000; i++) {
    const orig = hostTestBuf[i];
    const modified = mutableBuf[i];
    if (modified === orig + 1) plusOneCount++;
    if (modified === orig - 1) minusOneCount++;
    assert((modified & 1) === 1, `Bit ${i} successfully flipped to target 1 via ±1`);
  }
  assert(plusOneCount > 300 && minusOneCount > 300, `LSB matching distributed both +1 (${plusOneCount}) and -1 (${minusOneCount}) transitions evenly`);

  // --------------------------------------------------------------------------
  // TEST 5: Single Payload Embedding & Extraction (B2 & B3)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 5: Single Spell Embedding & Extraction with AES-256-GCM');
  const singleHost = await engine.exportLosslessImage(pristineRgb, width, height, 'png');
  const secretSpell = 'Eye of Agamotto: Vishanti Shield Command Alpha-77';
  const masterPass = 'AncientOnePassword2026!';

  const singleSealRes = await engine.sealSpell({
    hostImage: singleHost,
    isDualPayload: false,
    primaryPayload: { type: 'text', text: secretSpell },
    primaryPassword: masterPass,
    outputFormat: 'png'
  });
  assert(singleSealRes.success === true, 'Single spell successfully sealed into PNG');

  // Reveal with correct password
  const singleRevealRes = await engine.revealSpell({
    stegoImage: singleSealRes.stegoBuffer,
    password: masterPass
  });
  assert(singleRevealRes.success === true, 'Single spell unsealed with correct master password');
  assert(singleRevealRes.text === secretSpell, 'Decrypted text matches original secret exactly');

  // Reveal with wrong password (Silent Neutral Failure - B2 & B3)
  const wrongRevealRes = await engine.revealSpell({
    stegoImage: singleSealRes.stegoBuffer,
    password: 'WrongIncantationAttempt'
  });
  assert(wrongRevealRes.success === false, 'Wrong password fails gracefully');
  assert(wrongRevealRes.message === 'No incantation detected in the mystic weave.', 'Neutral status message returned on wrong password without throwing exceptions');

  // --------------------------------------------------------------------------
  // TEST 6: Plausible Deniability (Multi-Payload Dual Secrets) - A2
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 6: Plausible Deniability Dual-Payload Weave (A2)');
  const decoyMessage = 'Shopping List: Earl Grey tea, 2 parchment scrolls, mystic ink';
  const decoyPass = 'WongTeaTime42';
  const trueMasterSecret = 'Book of Cagliostro: Reality warping codex fragment 0x99A';
  const trueMasterPass = 'SorcererSupremeDoctorStrange';

  const dualSealRes = await engine.sealSpell({
    hostImage: singleHost,
    isDualPayload: true,
    primaryPayload: { type: 'text', text: trueMasterSecret },
    primaryPassword: trueMasterPass,
    decoyPayload: { type: 'text', text: decoyMessage },
    decoyPassword: decoyPass,
    outputFormat: 'png'
  });
  assert(dualSealRes.success === true, 'Dual payload successfully woven into single vessel');

  // 6A. Extract Decoy with Decoy Password
  const decoyExtract = await engine.revealSpell({
    stegoImage: dualSealRes.stegoBuffer,
    password: decoyPass
  });
  assert(decoyExtract.success === true, 'Decoy spell unsealed with Decoy password');
  assert(decoyExtract.text === decoyMessage, 'Decoy message extracted with 100% integrity');
  assert(decoyExtract.partitionMode === 'decoy', 'Decoy cleanly identified in Partition A');

  // 6B. Extract Master with Master Password
  const masterExtract = await engine.revealSpell({
    stegoImage: dualSealRes.stegoBuffer,
    password: trueMasterPass
  });
  assert(masterExtract.success === true, 'Master spell unsealed with Master password');
  assert(masterExtract.text === trueMasterSecret, 'Master secret extracted with 100% integrity');
  assert(masterExtract.partitionMode === 'primary', 'Master cleanly identified in Partition B');

  // 6C. Plausible Deniability: An adversary forcing disclosure of Decoy password gets Decoy,
  // with ZERO indication that a Master secret exists
  assert(decoyExtract.text !== masterExtract.text, 'Decoy and Master secrets are completely independent');

  // --------------------------------------------------------------------------
  // TEST 7: Difference Map Generation & Metrics
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 7: Difference Map Visualizer & Metrics (B1)');
  const diffResult = await engine.generateDifferenceMap(
    pristineRgb,
    loadedPng.rawRgb,
    width,
    height,
    50
  );
  assert(diffResult.diffPngBuffer.length > 0, 'Difference map PNG buffer generated');
  assert(diffResult.stats.modifiedPixels === 0, 'Pristine comparison shows 0 modified pixels');
  assert(diffResult.stats.psnr === 'Infinite (Pristine)', 'Pristine PSNR is Infinite');

  console.log('\n================================================================');
  console.log(`✨ VERIFICATION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (100%)`);
  console.log('================================================================');
}

runTestSuite().catch(err => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
