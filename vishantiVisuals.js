/**
 * ============================================================================
 * THE VISHANTI CIPHER - GALACTIC & SCI-FI VISUAL ENGINE
 * Cosmic Starfield, Eldritch Tao Mandalas, Sling-Ring Sparks & Audio Synthesis
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. PROCEDURAL SCI-FI AUDIO FEEDBACK (NON-INTRUSIVE TACTILE SOUNDS)
  // ==========================================================================
  class SciFiAudio {
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

    // Soft cybernetic hover tick
    playHoverTick() {
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(1900, now + 0.03);

        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.045);
      } catch (e) {}
    }

    // High-tech quantum engage click
    playQuantumClick() {
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(1160, now + 0.07);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } catch (e) {}
    }

    // Portal energy surge when initiating spell weave
    playPortalSurge() {
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.07, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.52);
      } catch (e) {}
    }
  }

  const sfx = new SciFiAudio();

  // Attach tactile sound triggers to interactive elements
  function attachSoundTriggers() {
    const hoverTargets = document.querySelectorAll(
      '.tab-btn, .btn-primary-action, .vtab-btn, .btn-save-stego, .btn-link, .btn-micro, .btn-copy, .btn-download-file, .pill-btn'
    );

    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => sfx.playHoverTick(), { passive: true });
      el.addEventListener('click', () => sfx.playQuantumClick(), { passive: true });
    });
  }

  // ==========================================================================
  // 2. COSMIC STARFIELD & VISHANTI TAO MANDALA CANVAS
  // ==========================================================================
  class CosmicCanvas {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.stars = [];
      this.sparks = [];
      this.comets = [];
      this.mandalaAngle = 0;
      this.secondaryAngle = 0;
      this.mouseX = this.width / 2;
      this.mouseY = this.height / 2;
      this.targetMouseX = this.mouseX;
      this.targetMouseY = this.mouseY;
      this.lastFrameTime = performance.now();
      this.isActive = true;

      this.init();
    }

    init() {
      this.resize();
      window.addEventListener('resize', () => this.resize(), { passive: true });

      // Track mouse with smoothing
      window.addEventListener(
        'mousemove',
        (e) => {
          this.targetMouseX = e.clientX;
          this.targetMouseY = e.clientY;
        },
        { passive: true }
      );

      // Visibility change to pause loop when minimized
      document.addEventListener('visibilitychange', () => {
        this.isActive = !document.hidden;
        if (this.isActive) {
          this.lastFrameTime = performance.now();
          requestAnimationFrame((t) => this.render(t));
        }
      });

      this.createStars(140);
      this.createSparks(35);
      this.scheduleComet();

      requestAnimationFrame((t) => this.render(t));
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width * window.devicePixelRatio;
      this.canvas.height = this.height * window.devicePixelRatio;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    createStars(count) {
      this.stars = [];
      for (let i = 0; i < count; i++) {
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 1.4 + 0.4,
          baseAlpha: Math.random() * 0.65 + 0.25,
          twinkleSpeed: Math.random() * 0.025 + 0.008,
          twinklePhase: Math.random() * Math.PI * 2,
          speedX: (Math.random() - 0.5) * 0.08,
          speedY: (Math.random() - 0.5) * 0.08,
          color: Math.random() > 0.7 ? '#ffeaa7' : Math.random() > 0.4 ? '#7df9ff' : '#ffffff',
          depth: Math.random() * 0.6 + 0.4
        });
      }
    }

    createSparks(count) {
      this.sparks = [];
      for (let i = 0; i < count; i++) {
        this.sparks.push(this.newSpark());
      }
    }

    newSpark() {
      return {
        x: Math.random() * this.width,
        y: this.height + Math.random() * 50,
        radius: Math.random() * 1.6 + 0.6,
        alpha: Math.random() * 0.7 + 0.2,
        speedY: -(Math.random() * 0.6 + 0.3),
        speedX: (Math.random() - 0.5) * 0.4,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.01,
        life: Math.random() * 400 + 200,
        maxLife: 600,
        color: Math.random() > 0.4 ? 'rgba(255, 176, 32, ' : 'rgba(0, 245, 255, '
      };
    }

    scheduleComet() {
      const nextTime = Math.random() * 9000 + 7000;
      setTimeout(() => {
        if (this.isActive) {
          this.comets.push({
            x: Math.random() * this.width * 0.8,
            y: Math.random() * (this.height * 0.3),
            length: Math.random() * 120 + 80,
            speed: Math.random() * 7 + 8,
            angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
            alpha: 1,
            decay: 0.018
          });
        }
        this.scheduleComet();
      }, nextTime);
    }

    // Trigger burst of Sling-Ring embers at specific coordinate
    burstSparks(x, y, count = 40) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 5 + 2;
        this.sparks.push({
          x: x,
          y: y,
          radius: Math.random() * 2 + 1,
          alpha: 1,
          speedX: Math.cos(angle) * velocity,
          speedY: Math.sin(angle) * velocity - 1,
          swayPhase: 0,
          swaySpeed: 0.05,
          life: 0,
          maxLife: Math.random() * 80 + 50,
          color: Math.random() > 0.3 ? 'rgba(255, 180, 40, ' : 'rgba(255, 90, 40, '
        });
      }
    }

    render(timestamp) {
      if (!this.isActive) return;

      const dt = Math.min(32, timestamp - this.lastFrameTime);
      this.lastFrameTime = timestamp;

      // Mouse smoothing
      this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
      this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

      const mouseNormX = (this.mouseX / this.width - 0.5) * 20;
      const mouseNormY = (this.mouseY / this.height - 0.5) * 20;

      this.ctx.clearRect(0, 0, this.width, this.height);

      // 1. Draw Background Vishanti Tao Mandalas (Geometric Projections)
      this.mandalaAngle += 0.0008 * (dt / 16);
      this.secondaryAngle -= 0.0005 * (dt / 16);

      this.drawTaoMandala(
        this.width * 0.85 + mouseNormX * 0.4,
        this.height * 0.18 + mouseNormY * 0.4,
        280,
        this.mandalaAngle,
        'rgba(255, 176, 32, 0.05)',
        'rgba(0, 245, 255, 0.03)'
      );

      this.drawTaoMandala(
        this.width * 0.12 - mouseNormX * 0.3,
        this.height * 0.82 - mouseNormY * 0.3,
        340,
        this.secondaryAngle,
        'rgba(168, 85, 247, 0.04)',
        'rgba(255, 176, 32, 0.025)'
      );

      // 2. Render Stars with Depth Parallax
      this.ctx.save();
      for (let star of this.stars) {
        star.twinklePhase += star.twinkleSpeed;
        const currentAlpha =
          star.baseAlpha + Math.sin(star.twinklePhase) * 0.3;

        star.x += star.speedX;
        star.y += star.speedY;

        if (star.x < 0) star.x = this.width;
        if (star.x > this.width) star.x = 0;
        if (star.y < 0) star.y = this.height;
        if (star.y > this.height) star.y = 0;

        const px = star.x + mouseNormX * star.depth * 0.5;
        const py = star.y + mouseNormY * star.depth * 0.5;

        this.ctx.fillStyle = star.color;
        this.ctx.globalAlpha = Math.max(0.1, Math.min(1, currentAlpha));
        this.ctx.beginPath();
        this.ctx.arc(px, py, star.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Extra outer halo for larger stars
        if (star.radius > 1.2) {
          this.ctx.globalAlpha = Math.max(0.02, currentAlpha * 0.2);
          this.ctx.beginPath();
          this.ctx.arc(px, py, star.radius * 3, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
      this.ctx.restore();

      // 3. Render Shooting Stars / Comets
      if (this.comets.length > 0) {
        this.ctx.save();
        for (let i = this.comets.length - 1; i >= 0; i--) {
          const comet = this.comets[i];
          const tailX = comet.x - Math.cos(comet.angle) * comet.length;
          const tailY = comet.y - Math.sin(comet.angle) * comet.length;

          const grad = this.ctx.createLinearGradient(
            tailX,
            tailY,
            comet.x,
            comet.y
          );
          grad.addColorStop(0, 'rgba(0, 245, 255, 0)');
          grad.addColorStop(0.8, `rgba(255, 218, 102, ${comet.alpha * 0.5})`);
          grad.addColorStop(1, `rgba(255, 255, 255, ${comet.alpha})`);

          this.ctx.strokeStyle = grad;
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(tailX, tailY);
          this.ctx.lineTo(comet.x, comet.y);
          this.ctx.stroke();

          // Comet head glow
          this.ctx.fillStyle = `rgba(255, 255, 255, ${comet.alpha})`;
          this.ctx.beginPath();
          this.ctx.arc(comet.x, comet.y, 2, 0, Math.PI * 2);
          this.ctx.fill();

          comet.x += Math.cos(comet.angle) * comet.speed;
          comet.y += Math.sin(comet.angle) * comet.speed;
          comet.alpha -= comet.decay;

          if (comet.alpha <= 0) {
            this.comets.splice(i, 1);
          }
        }
        this.ctx.restore();
      }

      // 4. Render Floating Eldritch Sparks (Doctor Strange Magic Embers)
      this.ctx.save();
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const spark = this.sparks[i];
        spark.swayPhase += spark.swaySpeed;
        spark.x += spark.speedX + Math.sin(spark.swayPhase) * 0.35;
        spark.y += spark.speedY;
        spark.life++;

        let alpha = spark.alpha;
        if (spark.life > spark.maxLife * 0.7) {
          alpha =
            spark.alpha *
            (1 - (spark.life - spark.maxLife * 0.7) / (spark.maxLife * 0.3));
        }

        if (alpha <= 0 || spark.y < -20 || spark.life >= spark.maxLife) {
          if (this.sparks.length <= 40) {
            this.sparks[i] = this.newSpark();
          } else {
            this.sparks.splice(i, 1);
          }
          continue;
        }

        this.ctx.fillStyle = spark.color + Math.max(0, alpha) + ')';
        this.ctx.beginPath();
        this.ctx.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Shimmering aura
        this.ctx.fillStyle = spark.color + Math.max(0, alpha * 0.25) + ')';
        this.ctx.beginPath();
        this.ctx.arc(spark.x, spark.y, spark.radius * 2.8, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();

      requestAnimationFrame((t) => this.render(t));
    }

    // Draw Doctor Strange Sacred Geometry Tao Mandala
    drawTaoMandala(cx, cy, radius, rotation, strokeGold, strokeCyan) {
      this.ctx.save();
      this.ctx.translate(cx, cy);
      this.ctx.rotate(rotation);

      // Outer concentric circle with tick marks
      this.ctx.strokeStyle = strokeGold;
      this.ctx.lineWidth = 1.2;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
      this.ctx.stroke();

      // Middle dashed ring
      this.ctx.setLineDash([6, 8]);
      this.ctx.strokeStyle = strokeCyan;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Overlapping squares (Octagram / Agamotto geometry)
      const rInner = radius * 0.65;
      this.ctx.strokeStyle = strokeGold;
      this.ctx.lineWidth = 1;

      for (let i = 0; i < 2; i++) {
        this.ctx.save();
        this.ctx.rotate((Math.PI / 4) * i);
        this.ctx.strokeRect(-rInner / 2, -rInner / 2, rInner, rInner);
        this.ctx.restore();
      }

      // Inner triangle pair (Hexagram)
      this.ctx.strokeStyle = strokeCyan;
      const triR = radius * 0.42;
      this.drawPolygon(0, 0, triR, 3, 0);
      this.drawPolygon(0, 0, triR, 3, Math.PI);

      // Core concentric circles
      this.ctx.strokeStyle = strokeGold;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius * 0.18, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.restore();
    }

    drawPolygon(x, y, radius, sides, startAngle) {
      this.ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const a = startAngle + (i * 2 * Math.PI) / sides;
        const px = x + radius * Math.cos(a);
        const py = y + radius * Math.sin(a);
        if (i === 0) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      }
      this.ctx.closePath();
      this.ctx.stroke();
    }
  }

  // ==========================================================================
  // 3. UI INTERACTION ENHANCER (PORTAL BURSTS, SHOCKWAVES & TILT)
  // ==========================================================================
  function setupInteractiveVisuals(cosmicCanvasInstance) {
    // 1. Spell Sealing Button Sparks & Surge
    const btnSeal = document.getElementById('btnSealSpell');
    if (btnSeal) {
      btnSeal.addEventListener('click', (e) => {
        sfx.playPortalSurge();
        const rect = btnSeal.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        if (cosmicCanvasInstance) {
          cosmicCanvasInstance.burstSparks(x, y, 60);
        }
        createScreenShockwave(x, y, 'gold');
      });
    }

    // 2. Reveal Spell Button Sparks
    const btnReveal = document.getElementById('btnRevealSpell');
    if (btnReveal) {
      btnReveal.addEventListener('click', (e) => {
        const rect = btnReveal.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        if (cosmicCanvasInstance) {
          cosmicCanvasInstance.burstSparks(x, y, 45);
        }
        createScreenShockwave(x, y, 'cyan');
      });
    }

    // 3. 3D Subtle Card Tilt Effect following cursor
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const tiltX = (y - centerY) / 35;
        const tiltY = (centerX - x) / 35;

        card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(
          2
        )}deg) rotateY(${tiltY.toFixed(2)}deg) translateZ(2px)`;

        // Update holographic glow coordinate
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform =
          'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
      });
    });
  }

  // Visual Shockwave Ring Effect
  function createScreenShockwave(x, y, theme = 'gold') {
    const wave = document.createElement('div');
    wave.className = `cosmic-shockwave ${theme}`;
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;
    document.body.appendChild(wave);

    setTimeout(() => {
      wave.remove();
    }, 900);
  }

  // Initialize once DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    const cosmicCanvasInstance = new CosmicCanvas('cosmicCanvas');
    setupInteractiveVisuals(cosmicCanvasInstance);
    attachSoundTriggers();
  });
})();
