/**
 * Eya Msolli — Portfolio Application Script
 * Full IoT Game & Sensor Experience
 * Plain TypeScript implementation
 */

type ThemeId = 'creative-lab' | 'retro-pop' | 'digital-night';
type IoTNodeType = 'ecg' | 'ai' | 'gps';

interface ThemePreset {
  id: ThemeId;
  label: string;
  dotColor: string;
}

const THEME_PRESETS: Record<ThemeId, ThemePreset> = {
  'creative-lab': { id: 'creative-lab', label: 'Creative Lab', dotColor: '#D2FF19' },
  'retro-pop': { id: 'retro-pop', label: 'Retro Pop', dotColor: '#FF5722' },
  'digital-night': { id: 'digital-night', label: 'Digital Night', dotColor: '#C084FC' },
};

// Global State
let currentTheme: ThemeId = 'creative-lab';
let activeIoTNode: IoTNodeType = 'ecg';
let userXP = 250;
let sfxEnabled = true;
let audioCtx: AudioContext | null = null;
let toastTimer: number | null = null;
let xpTimer: number | null = null;
let currentBpm = 74;

// Gamification Quests State
const questsCompleted = {
  sample: false,
  send: false,
  infer: false,
};

function init(): void {
  setupNavigation();
  setupVibeSwitcher();
  setupClipboardActions();
  setupIoTLab();
  setupCircuitProbes();
  setupSensorHud();
  setupSoundEffects();
  setupFooterYear();
}

/**
 * Web Audio API Synthesizer (Retro-Tech Sound FX)
 */
function playTone(freq: number, type: OscillatorType = 'sine', duration = 0.08, endFreq?: number): void {
  if (!sfxEnabled) return;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
    }

    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {
    // Audio context not allowed or failed
  }
}

/**
 * Award XP to user and display floating banner
 */
function addXP(amount: number, reason?: string): void {
  userXP += amount;
  const xpScoreEl = document.getElementById('hud-xp-score');
  if (xpScoreEl) xpScoreEl.textContent = String(userXP);

  const xpPopup = document.getElementById('xp-popup');
  if (xpPopup) {
    xpPopup.textContent = `+${amount} XP ⚡ ${reason ? `· ${reason}` : ''}`;
    xpPopup.classList.add('show');

    if (xpTimer !== null) window.clearTimeout(xpTimer);
    xpTimer = window.setTimeout(() => {
      xpPopup.classList.remove('show');
      xpTimer = null;
    }, 1800);
  }

  playTone(587.33, 'triangle', 0.12, 880); // Level-up chord
}

/**
 * Sound FX toggle setup
 */
function setupSoundEffects(): void {
  const toggleBtn = document.getElementById('sfx-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      toggleBtn.textContent = sfxEnabled ? '🔊 SFX: ON' : '🔇 SFX: OFF';
      toggleBtn.classList.toggle('active', sfxEnabled);
      if (sfxEnabled) {
        playTone(520, 'sine', 0.1, 780);
        showToast('Sound effects enabled');
      } else {
        showToast('Sound effects muted');
      }
    });
  }
}

/**
 * Top HUD Biosensor Clicker
 */
function setupSensorHud(): void {
  const sensorToggle = document.getElementById('hud-sensor-toggle');
  const bpmDisplay = document.getElementById('hud-bpm-display');

  if (sensorToggle) {
    sensorToggle.addEventListener('click', () => {
      const bpmOptions = [68, 72, 76, 82, 88, 94];
      currentBpm = bpmOptions[Math.floor(Math.random() * bpmOptions.length)];
      if (bpmDisplay) bpmDisplay.textContent = `${currentBpm} BPM`;

      playTone(660, 'sine', 0.06, 920);
      addXP(10, 'Heartbeat Sampled');
      showToast(`AD8232 Sensor: Simulated Heart Rate ${currentBpm} BPM`);
    });
  }
}

/**
 * Interactive Circuit Probes on Project Cards
 */
function setupCircuitProbes(): void {
  const probeButtons = document.querySelectorAll('.circuit-probe-btn');
  const ledTx = document.getElementById('led-tx');
  const ledRx = document.getElementById('led-rx');

  probeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const projectKey = btn.getAttribute('data-project');
      playTone(440, 'square', 0.1, 660);

      if (ledTx) {
        ledTx.classList.add('tx-active');
        window.setTimeout(() => ledTx.classList.remove('tx-active'), 500);
      }
      if (ledRx) {
        ledRx.classList.add('rx-active');
        window.setTimeout(() => ledRx.classList.remove('rx-active'), 500);
      }

      if (projectKey === 'ecg') {
        addXP(25, 'ECG Telemetry Probed');
        showToast('AD8232 Circuit Probed: 250Hz ADC sampling verified.');
      } else if (projectKey === 'ai') {
        addXP(25, '1D-CNN Model Tested');
        showToast('TFLite Model Probed: 14.8ms latency on simulated edge device.');
      } else if (projectKey === 'gps') {
        addXP(25, 'GPS Telemetry Pinged');
        showToast('Geofence Pinged: Coordinates 35.8256N, 10.6369E active.');
      }
    });
  });
}

/**
 * Interactive Gamified IoT Testbench & Hardware Sandbox
 */
function setupIoTLab(): void {
  const tabEcg = document.getElementById('tab-node-ecg');
  const tabAi = document.getElementById('tab-node-ai');
  const tabGps = document.getElementById('tab-node-gps');

  const ledTx = document.getElementById('led-tx');
  const ledRx = document.getElementById('led-rx');
  const ledAlert = document.getElementById('led-alert');

  const pcbTitle = document.getElementById('pcb-node-title');
  const oledHeader = document.getElementById('oled-header-text');
  const oledMetric1 = document.getElementById('oled-metric-1');
  const oledMetric2 = document.getElementById('oled-metric-2');
  const oledCanvas = document.getElementById('oled-canvas') as HTMLCanvasElement | null;

  const btnSample = document.getElementById('btn-sample-signal');
  const btnTransmit = document.getElementById('btn-transmit-packet');
  const btnInfer = document.getElementById('btn-run-inference');
  const btnAlert = document.getElementById('btn-trigger-alert');

  const serialLogs = document.getElementById('serial-terminal-logs');
  const serialInput = document.getElementById('serial-user-input') as HTMLInputElement | null;
  const serialSendBtn = document.getElementById('serial-send-btn');
  const clearSerialBtn = document.getElementById('btn-clear-serial');
  const chipBtns = document.querySelectorAll('.chip-btn');

  const setNode = (node: IoTNodeType): void => {
    activeIoTNode = node;
    playTone(330, 'triangle', 0.08, 520);
    document.querySelectorAll('.iot-node-btn').forEach((btn) => btn.classList.remove('active'));

    if (node === 'ecg') {
      tabEcg?.classList.add('active');
      if (pcbTitle) pcbTitle.textContent = 'ESP32-WROOM // AD8232 TELEMETRY';
      if (oledHeader) oledHeader.textContent = 'SYS: ECG STREAM READY';
      if (oledMetric1) oledMetric1.textContent = 'HEART RATE: 74 BPM';
      if (oledMetric2) oledMetric2.textContent = 'UPLINK: SIM7000E LTE-M';
      logSerial('Switched to Node: AD8232 IoT ECG Telemetry Node');
    } else if (node === 'ai') {
      tabAi?.classList.add('active');
      if (pcbTitle) pcbTitle.textContent = 'RASPBERRY PI // 1D-CNN EDGE INFERENCE';
      if (oledHeader) oledHeader.textContent = 'SYS: TFLITE RUNTIME ACTIVE';
      if (oledMetric1) oledMetric1.textContent = 'MODEL: 1D-CNN (PTB-XL)';
      if (oledMetric2) oledMetric2.textContent = 'QUANT: INT8 · 14.8ms';
      logSerial('Switched to Node: Edge AI 1D-CNN Inference Box');
    } else if (node === 'gps') {
      tabGps?.classList.add('active');
      if (pcbTitle) pcbTitle.textContent = 'ESP32 WEARABLE // ALZHEIMER ASSIST';
      if (oledHeader) oledHeader.textContent = 'SYS: GPS GEOTRACKING LOCKED';
      if (oledMetric1) oledMetric1.textContent = 'COORDS: 35.8256 N, 10.6369 E';
      if (oledMetric2) oledMetric2.textContent = 'GSM: ALERT READY (SOS)';
      logSerial("Switched to Node: Alzheimer's Assistive GPS Tracker");
    }
  };

  tabEcg?.addEventListener('click', () => setNode('ecg'));
  tabAi?.addEventListener('click', () => setNode('ai'));
  tabGps?.addEventListener('click', () => setNode('gps'));

  const flashLed = (el: HTMLElement | null, className: string, ms = 400): void => {
    if (!el) return;
    el.classList.add(className);
    window.setTimeout(() => el.classList.remove(className), ms);
  };

  const logSerial = (message: string, isCommand = false): void => {
    if (!serialLogs) return;
    const now = new Date();
    const timeStr = `[${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0')}]`;

    const entry = document.createElement('div');
    entry.className = 'serial-log-entry';
    if (isCommand) {
      entry.style.color = '#FBBF24';
    }

    entry.innerHTML = `<span class="serial-timestamp">${timeStr}</span> <span>${message}</span>`;
    serialLogs.appendChild(entry);
    serialLogs.scrollTop = serialLogs.scrollHeight;
  };

  const updateQuests = (questKey: 'sample' | 'send' | 'infer'): void => {
    questsCompleted[questKey] = true;

    if (questKey === 'sample') {
      const item = document.getElementById('quest-item-1');
      const check = document.getElementById('check-1');
      if (item) item.classList.add('completed');
      if (check) check.textContent = '✓';
    } else if (questKey === 'send') {
      const item = document.getElementById('quest-item-2');
      const check = document.getElementById('check-2');
      if (item) item.classList.add('completed');
      if (check) check.textContent = '✓';
    } else if (questKey === 'infer') {
      const item = document.getElementById('quest-item-3');
      const check = document.getElementById('check-3');
      if (item) item.classList.add('completed');
      if (check) check.textContent = '✓';
    }

    const count = Object.values(questsCompleted).filter(Boolean).length;
    const badge = document.getElementById('quest-score-badge');
    if (badge) badge.textContent = `${count} / 3 Done`;

    if (count === 3) {
      const banner = document.getElementById('achievement-unlocked-banner');
      if (banner && banner.style.display === 'none') {
        banner.style.display = 'block';
        addXP(100, 'All Quests Mastered!');
        showToast('🏆 Quest Complete: Certified IoT Engineer badge unlocked!');
      }
    }
  };

  // Button 1: Sample Signal
  btnSample?.addEventListener('click', () => {
    flashLed(ledRx, 'rx-active', 600);
    playTone(480, 'sine', 0.08, 640);
    const adcVal = Math.floor(580 + Math.random() * 80);
    const bpm = Math.floor(70 + Math.random() * 12);

    if (oledMetric1) {
      oledMetric1.textContent = activeIoTNode === 'ecg' ? `HEART RATE: ${bpm} BPM` : activeIoTNode === 'ai' ? 'SAMPLE: 12-LEAD SYNTH' : 'SATELLITES: 9 (FIX 3D)';
    }

    logSerial(`[ADC_SAMPLE] Analog Channel 0: Raw ADC=${adcVal} (${(adcVal * 3.3 / 1024).toFixed(2)}V)`);
    updateQuests('sample');
    addXP(30, 'Sensor Sampled');
    showToast('⚡ Sensor sampled! Visual waveform pulsing');
  });

  // Button 2: Dispatch Packet
  btnTransmit?.addEventListener('click', () => {
    flashLed(ledTx, 'tx-active', 800);
    playTone(600, 'square', 0.08, 900);
    const packetId = Math.floor(1000 + Math.random() * 9000);
    const rssi = Math.floor(-65 - Math.random() * 15);

    logSerial(`[SIM7000E] AT+CIPSTART="TCP","firebaseio.com",443 -> CONNECT OK`);
    window.setTimeout(() => {
      logSerial(`[MQTT/GSM] Payload #${packetId} dispatched: { node: "${activeIoTNode}", rssi: "${rssi}dBm", ack: true }`);
      logSerial(`[CLOUD] HTTP 200: /telemetry/stream/packet_${packetId}.json synchronized`);
      updateQuests('send');
      addXP(40, 'Packet Dispatched');
      showToast('📡 Telemetry packet delivered to cloud database!');
    }, 250);
  });

  // Button 3: Run Inference
  btnInfer?.addEventListener('click', () => {
    flashLed(ledRx, 'rx-active', 400);
    flashLed(ledTx, 'tx-active', 400);
    playTone(720, 'triangle', 0.12, 1080);
    const confidence = (91 + Math.random() * 7.5).toFixed(1);
    const latency = (11 + Math.random() * 4).toFixed(1);

    logSerial(`[TFLITE] Invoking quantized 1D-CNN... Input tensor: [1, 1000, 1]`);
    window.setTimeout(() => {
      logSerial(`[INFERENCE] Result: Normal Sinus Rhythm (Confidence: ${confidence}%) · Latency: ${latency}ms`);
      if (oledMetric1) oledMetric1.textContent = `CONFIDENCE: ${confidence}%`;
      updateQuests('infer');
      addXP(50, '1D-CNN Inference Executed');
      showToast(`🧠 1D-CNN Inference completed in ${latency}ms!`);
    }, 200);
  });

  // Button 4: Simulate Alert
  btnAlert?.addEventListener('click', () => {
    flashLed(ledAlert, 'alert-active', 1800);
    playTone(220, 'sawtooth', 0.25, 440);
    logSerial(`[WARNING] Abnormal condition triggered! Initiating emergency protocol...`);
    logSerial(`[GSM] AT+CMGS="+216XXXXXXXX" -> Message sent: "ALERT: SOS Telemetry Triggered. Location: 35.8256N, 10.6369E"`);
    addXP(20, 'Alert Simulated');
    showToast('🚨 Alert simulated: Simulated emergency notification dispatched!');
  });

  const executeCommand = (cmd: string): void => {
    const trimmed = cmd.trim().toLowerCase();
    if (!trimmed) return;

    logSerial(`&gt; ${cmd}`, true);
    playTone(550, 'sine', 0.05);

    switch (trimmed) {
      case 'help':
        logSerial('Available commands: sample, send, infer, sos, clear, status, nodes, ping, xp');
        break;
      case 'sample':
        btnSample?.click();
        break;
      case 'send':
        btnTransmit?.click();
        break;
      case 'infer':
        btnInfer?.click();
        break;
      case 'sos':
      case 'alert':
        btnAlert?.click();
        break;
      case 'xp':
        logSerial(`Current Gamer XP: ${userXP} points!`);
        break;
      case 'clear':
        if (serialLogs) serialLogs.innerHTML = '';
        logSerial('Serial terminal cleared.');
        break;
      case 'status':
        logSerial(`Status: Online · Node: ${activeIoTNode} · Battery: 3.94V (LiPo) · Free RAM: 278KB`);
        break;
      case 'nodes':
        logSerial('Nodes: ecg (AD8232), ai (1D-CNN Pi), gps (Alzheimer Tracker)');
        break;
      case 'ping':
        logSerial('PING -> PONG! 14ms latency to cellular gateway.');
        break;
      default:
        logSerial(`Unknown command: "${cmd}". Type "help" for options.`);
        break;
    }
  };

  serialSendBtn?.addEventListener('click', () => {
    if (serialInput && serialInput.value) {
      executeCommand(serialInput.value);
      serialInput.value = '';
    }
  });

  serialInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (serialInput.value) {
        executeCommand(serialInput.value);
        serialInput.value = '';
      }
    }
  });

  chipBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (cmd) executeCommand(cmd);
    });
  });

  clearSerialBtn?.addEventListener('click', () => {
    if (serialLogs) serialLogs.innerHTML = '';
    logSerial('Serial terminal buffer cleared.');
  });

  // Real-time OLED Waveform Canvas Renderer
  if (oledCanvas) {
    const ctx = oledCanvas.getContext('2d');
    let offset = 0;

    const renderWaveform = (): void => {
      if (!ctx) return;
      const w = oledCanvas.width;
      const h = oledCanvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = activeIoTNode === 'ecg' ? '#38BDF8' : activeIoTNode === 'ai' ? '#C084FC' : '#4ADE80';
      ctx.lineWidth = 1.8;
      ctx.beginPath();

      offset += 1.5;

      for (let x = 0; x < w; x++) {
        let y = h / 2;
        const pos = (x + offset) % 180;

        if (activeIoTNode === 'ecg') {
          if (pos > 30 && pos < 40) y -= 4; // P wave
          else if (pos > 50 && pos < 55) y += 5; // Q
          else if (pos >= 55 && pos <= 65) y -= 18; // R spike
          else if (pos > 65 && pos < 70) y += 8; // S
          else if (pos > 85 && pos < 105) y -= 6; // T wave
        } else if (activeIoTNode === 'ai') {
          y = h / 2 + Math.sin((x + offset) * 0.1) * 8 + Math.cos((x - offset) * 0.05) * 4;
        } else {
          const wavePhase = (x + offset * 0.8) % 120;
          y = h / 2 + (wavePhase < 20 ? Math.sin(wavePhase * 0.3) * 12 : 0);
        }

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      requestAnimationFrame(renderWaveform);
    };

    renderWaveform();
  }
}

/**
 * Configure mobile navigation and active link highlighting
 */
function setupNavigation(): void {
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      const isExpanded = mobileBtn.getAttribute('aria-expanded') === 'true';
      mobileBtn.setAttribute('aria-expanded', String(!isExpanded));
      navLinks.classList.toggle('mobile-open');
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        mobileBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-link');

  const handleScroll = (): void => {
    const scrollPos = window.scrollY + 140;
    let currentId = '';

    sections.forEach((section) => {
      const el = section as HTMLElement;
      const top = el.offsetTop;
      const height = el.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = el.getAttribute('id') || '';
      }
    });

    navItems.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
}

/**
 * Configure "Customize my vibe" Theme Switcher without local storage
 */
function setupVibeSwitcher(): void {
  const openModalBtn = document.getElementById('open-vibe-modal-btn');
  const closeModalBtn = document.getElementById('close-vibe-modal-btn');
  const modalBackdrop = document.getElementById('vibe-modal-backdrop');
  const activeVibeLabel = document.getElementById('active-vibe-label');
  const activeVibeDot = document.getElementById('active-vibe-dot');
  const themeButtons = document.querySelectorAll('.theme-option-btn');

  const applyTheme = (themeId: ThemeId): void => {
    currentTheme = themeId;
    document.documentElement.setAttribute('data-theme', themeId);

    const preset = THEME_PRESETS[themeId];
    if (activeVibeLabel) activeVibeLabel.textContent = preset.label;
    if (activeVibeDot) activeVibeDot.style.backgroundColor = preset.dotColor;

    themeButtons.forEach((btn) => {
      const btnTheme = btn.getAttribute('data-theme');
      if (btnTheme === themeId) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  };

  if (openModalBtn && modalBackdrop) {
    openModalBtn.addEventListener('click', () => {
      modalBackdrop.classList.add('open');
    });
  }

  if (closeModalBtn && modalBackdrop) {
    closeModalBtn.addEventListener('click', () => {
      modalBackdrop.classList.remove('open');
    });
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.classList.remove('open');
      }
    });
  }

  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const themeId = btn.getAttribute('data-theme') as ThemeId;
      if (themeId && THEME_PRESETS[themeId]) {
        applyTheme(themeId);
        addXP(15, 'Theme Customized');
        showToast(`Vibe changed to ${THEME_PRESETS[themeId].label}!`);
        modalBackdrop?.classList.remove('open');
      }
    });
  });

  applyTheme(currentTheme);
}

/**
 * Configure clipboard copy buttons with visual feedback and XP
 */
function setupClipboardActions(): void {
  const copyEmailBtn = document.getElementById('copy-email-btn');
  const copyGithubBtn = document.getElementById('copy-github-btn');
  const copyLinkedinBtn = document.getElementById('copy-linkedin-btn');
  const emailValue = document.getElementById('email-address-text')?.textContent?.trim() || 'msolli.aya18@gmail.com';
  const githubValue = 'https://github.com/eyamsolli';
  const linkedinValue = 'https://www.linkedin.com/in/eya-msolli-222973205/';

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', async () => {
      await copyString(emailValue, 'Email address copied to clipboard');
      addXP(15, 'Email Copied');
    });
  }

  if (copyGithubBtn) {
    copyGithubBtn.addEventListener('click', async () => {
      await copyString(githubValue, 'GitHub profile link copied to clipboard');
      addXP(15, 'GitHub Link Copied');
    });
  }

  if (copyLinkedinBtn) {
    copyLinkedinBtn.addEventListener('click', async () => {
      await copyString(linkedinValue, 'LinkedIn profile link copied to clipboard');
      addXP(15, 'LinkedIn Link Copied');
    });
  }
}

/**
 * Copy text to clipboard with browser fallback
 */
async function copyString(text: string, msg: string): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const tempInput = document.createElement('textarea');
      tempInput.value = text;
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      document.body.appendChild(tempInput);
      tempInput.focus();
      tempInput.select();
      document.execCommand('copy');
      tempInput.remove();
    }
    showToast(msg);
  } catch (err) {
    showToast(`Copied: ${text}`);
  }
}

/**
 * Display toast notification
 */
function showToast(message: string): void {
  const toast = document.getElementById('toast-msg');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  if (toastTimer !== null) {
    window.clearTimeout(toastTimer);
  }

  toastTimer = window.setTimeout(() => {
    toast.classList.remove('show');
    toastTimer = null;
  }, 2200);
}

/**
 * Populate current calendar year in footer
 */
function setupFooterYear(): void {
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear().toString();
  }
}

// Initialize on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
