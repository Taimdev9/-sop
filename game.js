/* ==========================================================================
   LAST BEAT - Complete Game Engine
   Sop Game Jam Entry - Critical Point Theme
   ========================================================================== */

(function () {
    'use strict';

    // ==========================================================================
    // 1. GAME CONSTANTS & STATE MANAGEMENT
    // ==========================================================================
    const STATE = {
        INIT: 0,
        AUDIO_UNLOCK: 1,
        LOADING: 2,
        DEVICE_SELECT: 3,
        INTRO_CUTSCENE: 4,
        PLAYING: 5,
        DIALOGUE: 6,
        CRITICAL_POINT: 7,
        GAME_OVER: 8,
        ENDING: 9
    };

    const CONFIG = {
        CANVAS_WIDTH: 960,
        CANVAS_HEIGHT: 540,
        GRAVITY: 0.45,
        WALK_SPEED: 2.2,
        RUN_SPEED: 4.2,
        ADRENALINE_SPEED: 5.8,
        MAX_STABILITY: 100,
        CRITICAL_THRESHOLD_1: 20,
        CRITICAL_THRESHOLD_2: 15,
        FATAL_THRESHOLD: 5,
        WORLD_WIDTH: 4800
    };

    const game = {
        currentState: STATE.INIT,
        selectedDevice: 'computer',
        
        // البيانات الحيوية للاعب
        heartStability: 100,
        bpm: 72,
        isRunning: false,
        isCritical: false,
        isAdrenalineActive: false,
        timeSurvived: 0,
        minStabilityReached: 100,
        maxBpmReached: 72,
        
        // نظام الكاميرا والمؤثرات
        cameraX: 0,
        targetCameraX: 0,
        screenShake: { intensity: 0, duration: 0 },
        
        // أحداث القصة
        currentZone: 0,
        blackoutOccurred: false,
        radioMessageReceived: false,
        hallucinationActive: false,
        reactorReached: false,
        
        // المراجع البرمجية لـ DOM
        dom: {},
        ctx: null,
        lightCtx: null,
        particleCtx: null,
        hudEcgCtx: null,
        endingEcgCtx: null,
        dialogueAvatarCtx: null
    };

    // ==========================================================================
    // 2. WEB AUDIO API SYNTHESIZER ENGINE (محرك الصوت التخليقي)
    // ==========================================================================
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.isUnlocked = false;
            this.masterGain = null;
            this.heartGain = null;
            this.ambientGain = null;
            this.sfxGain = null;
            
            this.heartbeatTimer = null;
            this.tinnitusNode = null;
            this.droneOscillator = null;
        }

        init() {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioCtx();
                
                this.masterGain = this.ctx.createGain();
                this.heartGain = this.ctx.createGain();
                this.ambientGain = this.ctx.createGain();
                this.sfxGain = this.ctx.createGain();

                this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
                this.heartGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
                this.ambientGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
                this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

                this.heartGain.connect(this.masterGain);
                this.ambientGain.connect(this.masterGain);
                this.sfxGain.connect(this.masterGain);
                this.masterGain.connect(this.ctx.destination);

                this.isUnlocked = true;
                this.startAmbientDrone();
                return true;
            } catch (e) {
                return false;
            }
        }

        // تخليق صوت نبض القلب البرمجي (Boom... Boom...)
        triggerHeartbeat(intensity = 1.0) {
            if (!this.isUnlocked || !this.ctx) return;

            const now = this.ctx.currentTime;
            
            // النبضة الأولى (Lub)
            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();
            const filter1 = this.ctx.createBiquadFilter();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(60, now);
            osc1.frequency.exponentialRampToValueAtTime(20, now + 0.12);

            filter1.type = 'lowpass';
            filter1.frequency.setValueAtTime(120, now);

            gain1.gain.setValueAtTime(0, now);
            gain1.gain.linearRampToValueAtTime(1.2 * intensity, now + 0.02);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc1.connect(filter1);
            filter1.connect(gain1);
            gain1.connect(this.heartGain);

            osc1.start(now);
            osc1.stop(now + 0.16);

            // النبضة الثانية (Dub)
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            const filter2 = this.ctx.createBiquadFilter();

            const delay2 = now + 0.12;

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(75, delay2);
            osc2.frequency.exponentialRampToValueAtTime(25, delay2 + 0.1);

            filter2.type = 'lowpass';
            filter2.frequency.setValueAtTime(140, delay2);

            gain2.gain.setValueAtTime(0, delay2);
            gain2.gain.linearRampToValueAtTime(0.9 * intensity, delay2 + 0.02);
            gain2.gain.exponentialRampToValueAtTime(0.001, delay2 + 0.12);

            osc2.connect(filter2);
            filter2.connect(gain2);
            gain2.connect(this.heartGain);

            osc2.start(delay2);
            osc2.stop(delay2 + 0.14);
        }

        // صوت النفير والصفير عند النقطة الحرجة (Tinnitus)
        startTinnitus() {
            if (!this.isUnlocked || this.tinnitusNode) return;

            const now = this.ctx.currentTime;
            this.tinnitusNode = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            this.tinnitusNode.type = 'sine';
            this.tinnitusNode.frequency.setValueAtTime(3800, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.12, now + 1.5);

            this.tinnitusNode.connect(gain);
            gain.connect(this.masterGain);

            this.tinnitusNode.start(now);
            this.tinnitusNode.gainNode = gain;
        }

        stopTinnitus() {
            if (this.tinnitusNode) {
                const now = this.ctx.currentTime;
                this.tinnitusNode.gainNode.gain.linearRampToValueAtTime(0.001, now + 0.5);
                setTimeout(() => {
                    if (this.tinnitusNode) {
                        this.tinnitusNode.stop();
                        this.tinnitusNode = null;
                    }
                }, 500);
            }
        }

        // توليد الأصوات المحيطية للمستشفى
        startAmbientDrone() {
            if (!this.isUnlocked) return;

            const now = this.ctx.currentTime;
            this.droneOscillator = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            this.droneOscillator.type = 'sawtooth';
            this.droneOscillator.frequency.setValueAtTime(45, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(90, now);

            gain.gain.setValueAtTime(0.15, now);

            this.droneOscillator.connect(filter);
            filter.connect(gain);
            gain.connect(this.ambientGain);

            this.droneOscillator.start(now);
        }

        // توليد أصوات الشرر والكهرباء عند انقطاع التيار
        playElectricSpark() {
            if (!this.isUnlocked) return;

            const bufferSize = this.ctx.sampleRate * 0.1;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(2500, this.ctx.currentTime);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.09);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            noise.start();
        }

        // صوت الخطوات البرمجي
        playFootstep() {
            if (!this.isUnlocked) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.05);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.06);
        }

        // صوت جهاز اللاسلكي التشويشي
        playRadioStatic() {
            if (!this.isUnlocked) return;

            const bufferSize = this.ctx.sampleRate * 0.4;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.15;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            noise.connect(this.sfxGain);
            noise.start();
        }
    }

    const audio = new SoundEngine();

    // ==========================================================================
    // 3. PLAYER & PHYSICS SYSTEM (نظام اللاعب والحركة)
    // ==========================================================================
    class Player {
        constructor() {
            this.x = 180;
            this.y = 380;
            this.width = 32;
            this.height = 64;
            this.vx = 0;
            this.vy = 0;
            this.facingRight = true;
            this.isGrounded = true;
            this.frame = 0;
            this.frameTimer = 0;
            this.state = 'idle'; // idle, walk, run, faint
        }

        update(keys, touchState) {
            let moveLeft = keys.left || touchState.left;
            let moveRight = keys.right || touchState.right;
            let runKey = keys.run || touchState.run;

            let currentSpeed = CONFIG.WALK_SPEED;

            // تطبيق سرعة الادرينالين عند النقطة الحرجة 15%
            if (game.isAdrenalineActive) {
                currentSpeed = CONFIG.ADRENALINE_SPEED;
            } else if (runKey && game.heartStability > CONFIG.CRITICAL_THRESHOLD_1) {
                currentSpeed = CONFIG.RUN_SPEED;
                game.isRunning = true;
            } else {
                game.isRunning = false;
            }

            if (moveLeft) {
                this.vx = -currentSpeed;
                this.facingRight = false;
                this.state = game.isRunning ? 'run' : 'walk';
            } else if (moveRight) {
                this.vx = currentSpeed;
                this.facingRight = true;
                this.state = game.isRunning ? 'run' : 'walk';
            } else {
                this.vx = 0;
                this.state = 'idle';
            }

            // تحديث موقع اللاعب
            this.x += this.vx;

            // تقييد الحدود العالمية
            if (this.x < 50) this.x = 50;
            if (this.x > CONFIG.WORLD_WIDTH - 100) this.x = CONFIG.WORLD_WIDTH - 100;

            // تحديث إطارات الحركة
            this.frameTimer++;
            if (this.frameTimer > (this.state === 'run' ? 6 : 12)) {
                this.frame = (this.frame + 1) % 4;
                this.frameTimer = 0;

                if (this.state === 'walk' || this.state === 'run') {
                    audio.playFootstep();
                }
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x - game.cameraX, this.y);

            if (!this.facingRight) {
                ctx.scale(-1, 1);
                ctx.translate(-this.width, 0);
            }

            // رسم شخصية البطل بأسلوب Pixel Art
            // الجسم/ثوب المستشفى
            ctx.fillStyle = '#1e2d3b';
            ctx.fillRect(8, 20, 16, 32);

            // الرأس والوجه
            ctx.fillStyle = '#d1a384';
            ctx.fillRect(8, 4, 16, 16);

            // الشعر
            ctx.fillStyle = '#221811';
            ctx.fillRect(6, 2, 20, 6);

            // العينان
            ctx.fillStyle = '#000000';
            ctx.fillRect(18, 9, 2, 3);

            // جهاز قياس نبض القلب المربوط بصدره
            ctx.fillStyle = game.isCritical ? '#ff1e43' : '#00ff66';
            ctx.fillRect(12, 26, 4, 4);

            // الأرجُل بأسلوب الحركة
            ctx.fillStyle = '#111822';
            if (this.state === 'walk' || this.state === 'run') {
                const legOffset = Math.sin(this.frame * Math.PI / 2) * 6;
                ctx.fillRect(8, 52, 6, 12 + legOffset);
                ctx.fillRect(18, 52, 6, 12 - legOffset);
            } else {
                ctx.fillRect(8, 52, 6, 12);
                ctx.fillRect(18, 52, 6, 12);
            }

            ctx.restore();
        }
    }

    // ==========================================================================
    // 4. PROCEDURAL CANVAS RENDER ENGINE (محرك الرسم والتظليل)
    // ==========================================================================
    class RenderEngine {
        constructor() {
            this.particles = [];
        }

        drawEnvironment(ctx) {
            // خلفية المستشفى والأسقف
            ctx.fillStyle = '#05070a';
            ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

            const startTile = Math.floor(game.cameraX / 120);
            const endTile = startTile + Math.ceil(CONFIG.CANVAS_WIDTH / 120) + 1;

            // رسم بلاط الممرات والأبواب المجهدة
            for (let i = startTile; i < endTile; i++) {
                const worldX = i * 120 - game.cameraX;

                // الأرضية
                ctx.fillStyle = (i % 2 === 0) ? '#0c1017' : '#080b10';
                ctx.fillRect(worldX, 440, 120, 100);

                ctx.strokeStyle = '#151c28';
                ctx.lineWidth = 1;
                ctx.strokeRect(worldX, 440, 120, 100);

                // الجدران والأبواب
                ctx.fillStyle = '#0a0d14';
                ctx.fillRect(worldX, 100, 118, 340);

                // أجهزة ومعدات الطوارئ معلقة على الجدران
                if (i % 3 === 0) {
                    ctx.fillStyle = '#18202c';
                    ctx.fillRect(worldX + 20, 240, 40, 100);
                    ctx.fillStyle = game.blackoutOccurred ? '#330000' : '#00aa44';
                    ctx.fillRect(worldX + 35, 250, 10, 6);
                }

                // رسم مصابيح السقف المكسورة
                ctx.fillStyle = '#1c2533';
                ctx.fillRect(worldX + 40, 90, 40, 10);
            }
        }

        // إضاءة حركية وديناميكية الظلام (Lighting Overlay System)
        drawLighting(ctx) {
            ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

            if (!game.blackoutOccurred) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
                return;
            }

            // ظلام تام بعد انقطاع الكهرباء
            ctx.fillStyle = 'rgba(2, 3, 5, 0.96)';
            ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

            // ضوء الضرر والتألق من جهاز صدر اللاعب
            const playerScreenX = player.x - game.cameraX + 16;
            const playerScreenY = player.y + 30;

            const gradient = ctx.createRadialGradient(
                playerScreenX, playerScreenY, 10,
                playerScreenX, playerScreenY, game.isCritical ? 140 : 220
            );

            const lightColor = game.isCritical ? 'rgba(255, 30, 67, ' : 'rgba(0, 255, 102, ';
            gradient.addColorStop(0, lightColor + '0.8)');
            gradient.addColorStop(0.5, lightColor + '0.2)');
            gradient.addColorStop(1, 'transparent');

            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(playerScreenX, playerScreenY, 220, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }

        // رسم الهلوسات عند الانخفاض الحاد لاستقرار القلب
        drawHallucinations(ctx) {
            if (!game.hallucinationActive) return;

            const shadowX = player.x + 300 - game.cameraX;
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.shadowColor = '#ff1e43';
            ctx.shadowBlur = 15;

            // رسم ظل لشخصية الطبيب أو نسخة من اللاعب يختفي فجأة
            ctx.fillRect(shadowX, 370, 30, 70);
            ctx.restore();
        }
    }

    // ==========================================================================
    // 5. DIALOGUE & STORY SCRIPT ENGINE (نظام القصة والحوارات)
    // ==========================================================================
    const STORY_SCRIPT = {
        0: [
            { speaker: 'DOCTOR', text: 'العملية انتهت بنجاح... هل تسمعني؟' },
            { speaker: 'DOCTOR', text: 'حاول ألا تتحرك كثيراً... قلبك الذكي الجديد غير مستقر بعد.' }
        ],
        1: [
            { speaker: 'RADIO', text: 'تحذير شدييد! المفاعل الرئيسي للمستشفى في حالة انهيار حرارري!' },
            { speaker: 'RADIO', text: 'إذا كنت تسمعني... لا تتوقف! قلبك الذكي مرتبط بالمفاعل... توقفه يعني انهيار كل شيء!' }
        ],
        2: [
            { speaker: 'PLAYER', text: 'لماذا أصبحت المستشفى فارغة وفجائية بالكامل...؟' }
        ],
        3: [
            { speaker: 'PLAYER', text: 'هل رأيته هناك...؟ لا... هذا مستحيل نفسياً!' }
        ],
        CRITICAL_20: [
            { speaker: 'PLAYER', text: 'لا... ليس الآن... النبض يخرج عن السيطرة!' }
        ],
        CRITICAL_10: [
            { speaker: 'PLAYER', text: 'أرجوك... اصمد لثوانٍ معدودة فقط...' }
        ]
    };

    class DialogueSystem {
        constructor() {
            this.queue = [];
            this.currentLine = null;
            this.textIndex = 0;
            this.typingTimer = null;
            this.isTyping = false;
        }

        startSequence(scriptKey) {
            const lines = STORY_SCRIPT[scriptKey];
            if (!lines) return;

            this.queue = [...lines];
            game.currentState = STATE.DIALOGUE;
            game.dom.dialogueBox.classList.remove('hidden');
            this.next();
        }

        next() {
            if (this.queue.length === 0) {
                game.dom.dialogueBox.classList.add('hidden');
                game.currentState = STATE.PLAYING;
                return;
            }

            this.currentLine = this.queue.shift();
            game.dom.dialogueSpeaker.textContent = this.currentLine.speaker;
            game.dom.dialogueText.textContent = '';
            this.textIndex = 0;
            this.isTyping = true;

            clearInterval(this.typingTimer);
            this.typingTimer = setInterval(() => {
                if (this.textIndex < this.currentLine.text.length) {
                    game.dom.dialogueText.textContent += this.currentLine.text.charAt(this.textIndex);
                    this.textIndex++;
                    audio.pla