(function () {
    'use strict';

    const STATE = {
        INIT: 0,
        WARNING: 1,
        MENU: 2,
        SETTINGS: 3,
        DEVELOPERS: 4,
        LOADING: 5,
        DEVICE_SELECT: 6,
        PROLOGUE: 7,
        PLAYING: 8,
        DIALOGUE: 9,
        CRITICAL: 10,
        ENDING: 11
    };

    const CONFIG = {
        MAX_STABILITY: 100,
        CRITICAL_1: 20,
        CRITICAL_2: 15,
        FATAL: 5,
        WALK_SPEED: 0.12,
        RUN_SPEED: 0.22,
        ADRENALINE_SPEED: 0.32,
        ACT1_LENGTH: 150,
        ACT2_LENGTH: 300,
        ACT3_LENGTH: 450
    };

    const I18N = {
        ar: {
            walking: "جاري المشي",
            running: "جاري الركض",
            warningTitle: "تحذير محتوى وشروط اللعب",
            warningDesc: "تحتوي هذه اللعبة على مشاهد رعب نفسي، أصوات مفاجئة (Jump Scares)، وتأثيرات ضوئية قد لا تناسب بعض اللاعبين. بمتابعة اللعب فإنك توافق على ذلك.",
            agreeContinue: "موافق ومتابعة ◄",
            gameSubtitle: "آخر نبضة",
            btnPlay: "بدء اللعب",
            btnContinue: "متابعة",
            btnSettings: "الإعدادات",
            btnCredits: "المطورون",
            btnExit: "خروج",
            devsTitle: "المطورون",
            devsBy: "تطوير بواسطة:",
            devsCreator: "منشئ اللعبة:",
            btnBack: "رجوع ◄",
            settingsTitle: "الإعدادات",
            langLabel: "اللغة (Language)",
            masterVol: "صوت اللعبة العام",
            musicVol: "الموسيقى المحيطية",
            heartVol: "صوت نبض القلب",
            vibration: "الاهتزاز (Vibration)",
            fullscreen: "ملء الشاشة (Fullscreen)",
            btnEnable: "تفعيل",
            btnSaveBack: "حفظ ورجوع ◄",
            loadingBio: "جاري تحميل العالم ثلاثي الأبعاد...",
            chooseDevice: "اختر نوع جهازك",
            enterGame: "دخول المستشفى ◄",
            pressContinue: "اضغط للمتابعة ◄",
            btnRestart: "إعادة التجربة"
        },
        en: {
            walking: "WALKING",
            running: "RUNNING",
            warningTitle: "CONTENT WARNING",
            warningDesc: "This game contains psychological horror, sudden sounds (Jump Scares), and flashing light effects. By playing, you agree to these conditions.",
            agreeContinue: "AGREE & CONTINUE ◄",
            gameSubtitle: "LAST BEAT",
            btnPlay: "PLAY",
            btnContinue: "CONTINUE",
            btnSettings: "SETTINGS",
            btnCredits: "CREDITS",
            btnExit: "EXIT",
            devsTitle: "CREDITS",
            devsBy: "Developed by:",
            devsCreator: "Game Creator:",
            btnBack: "BACK ◄",
            settingsTitle: "SETTINGS",
            langLabel: "Language",
            masterVol: "Master Volume",
            musicVol: "Music Volume",
            heartVol: "Heartbeat Volume",
            vibration: "Vibration",
            fullscreen: "Fullscreen",
            btnEnable: "Enable",
            btnSaveBack: "SAVE & BACK ◄",
            loadingBio: "Loading 3D World...",
            chooseDevice: "CHOOSE YOUR DEVICE",
            enterGame: "ENTER HOSPITAL ◄",
            pressContinue: "PRESS TO CONTINUE ◄",
            btnRestart: "RESTART EXPERIENCE"
        }
    };

    const settings = {
        lang: 'ar',
        masterVol: 0.8,
        musicVol: 0.7,
        heartVol: 1.0,
        vibration: true
    };

    const game = {
        state: STATE.INIT,
        currentAct: 0,
        selectedDevice: 'computer',
        heartStability: 100,
        bpm: 72,
        isRunning: false,
        isCritical: false,
        isAdrenaline: false,
        hasKeycard: false,
        blackout: false,
        hallucinationActive: false,
        reactorReached: false,
        act2Triggered: false,
        act3Triggered: false,
        cameraShake: 0,
        maxBpm: 72,
        minStability: 100,
        dom: {},
        hudEcgCtx: null
    };

    class FirstPersonController {
        constructor(camera) {
            this.camera = camera;
            this.position = new THREE.Vector3(0, 1.6, 0);
            this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');

            this.moveForward = false;
            this.moveBackward = false;
            this.moveLeft = false;
            this.moveRight = false;
            this.runKey = false;

            this.touchMoveVector = { x: 0, y: 0 };
            this.isPointerLocked = false;
            this.stepTimer = 0;

            this.initListeners();
        }

        initListeners() {
            window.addEventListener('keydown', (e) => {
                if (e.code === 'KeyW' || e.code === 'ArrowUp') this.moveForward = true;
                if (e.code === 'KeyS' || e.code === 'ArrowDown') this.moveBackward = true;
                if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.moveLeft = true;
                if (e.code === 'KeyD' || e.code === 'ArrowRight') this.moveRight = true;
                if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.runKey = true;
                if (e.code === 'KeyE') {
                    if (game.state === STATE.DIALOGUE) dialogueEngine.next();
                }
                if (e.code === 'Escape') {
                    if (game.state === STATE.PLAYING) {
                        game.dom.settingsModal.classList.remove('hidden');
                    }
                }
                if (e.code === 'Space' && game.state === STATE.DIALOGUE) dialogueEngine.next();
            });

            window.addEventListener('keyup', (e) => {
                if (e.code === 'KeyW' || e.code === 'ArrowUp') this.moveForward = false;
                if (e.code === 'KeyS' || e.code === 'ArrowDown') this.moveBackward = false;
                if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.moveLeft = false;
                if (e.code === 'KeyD' || e.code === 'ArrowRight') this.moveRight = false;
                if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.runKey = false;
            });

            const viewport = document.getElementById('gameViewport');
            viewport.addEventListener('click', () => {
                if (game.selectedDevice === 'computer' && !this.isPointerLocked && game.state === STATE.PLAYING) {
                    viewport.requestPointerLock();
                }
            });

            document.addEventListener('pointerlockchange', () => {
                this.isPointerLocked = (document.pointerLockElement === viewport);
            });

            document.addEventListener('mousemove', (e) => {
                if (!this.isPointerLocked || game.state !== STATE.PLAYING) return;
                this.rotation.y -= e.movementX * 0.0022;
                this.rotation.x -= e.movementY * 0.0022;
                this.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.rotation.x));
                this.camera.quaternion.setFromEuler(this.rotation);
            });

            this.initTouchControls();
        }

        initTouchControls() {
            const moveZone = document.getElementById('touchMoveZone');
            const lookZone = document.getElementById('touchLookZone');
            const knob = document.getElementById('joystickKnob');

            let moveTouchId = null;
            let lookTouchId = null;
            let startX = 0, startY = 0;
            let lastLookX = 0, lastLookY = 0;

            moveZone.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.changedTouches[0];
                moveTouchId = touch.identifier;
                startX = touch.clientX;
                startY = touch.clientY;
                knob.style.display = 'block';
                knob.style.left = `${startX}px`;
                knob.style.top = `${startY}px`;
            }, { passive: false });

            moveZone.addEventListener('touchmove', (e) => {
                e.preventDefault();
                for (let touch of e.changedTouches) {
                    if (touch.identifier === moveTouchId) {
                        const dx = touch.clientX - startX;
                        const dy = touch.clientY - startY;
                        const dist = Math.min(40, Math.hypot(dx, dy));
                        const angle = Math.atan2(dy, dx);

                        this.touchMoveVector.x = (Math.cos(angle) * dist) / 40;
                        this.touchMoveVector.y = (Math.sin(angle) * dist) / 40;

                        knob.style.transform = `translate(-50%, -50%) translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
                    }
                }
            }, { passive: false });

            const endMove = (e) => {
                for (let touch of e.changedTouches) {
                    if (touch.identifier === moveTouchId) {
                        moveTouchId = null;
                        this.touchMoveVector = { x: 0, y: 0 };
                        knob.style.display = 'none';
                    }
                }
            };

            moveZone.addEventListener('touchend', endMove);
            moveZone.addEventListener('touchcancel', endMove);

            lookZone.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.changedTouches[0];
                lookTouchId = touch.identifier;
                lastLookX = touch.clientX;
                lastLookY = touch.clientY;
                if (game.state === STATE.DIALOGUE) dialogueEngine.next();
            }, { passive: false });

            lookZone.addEventListener('touchmove', (e) => {
                e.preventDefault();
                for (let touch of e.changedTouches) {
                    if (touch.identifier === lookTouchId) {
                        const dx = touch.clientX - lastLookX;
                        const dy = touch.clientY - lastLookY;

                        this.rotation.y -= dx * 0.004;
                        this.rotation.x -= dy * 0.004;
                        this.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.rotation.x));
                        this.camera.quaternion.setFromEuler(this.rotation);

                        lastLookX = touch.clientX;
                        lastLookY = touch.clientY;
                    }
                }
            }, { passive: false });

            const endLook = (e) => {
                for (let touch of e.changedTouches) {
                    if (touch.identifier === lookTouchId) {
                        lookTouchId = null;
                    }
                }
            };

            lookZone.addEventListener('touchend', endLook);
            lookZone.addEventListener('touchcancel', endLook);

            document.getElementById('btnTouchRun').addEventListener('touchstart', () => this.runKey = true);
            document.getElementById('btnTouchRun').addEventListener('touchend', () => this.runKey = false);
            document.getElementById('btnTouchInteract').addEventListener('touchstart', () => {
                if (game.state === STATE.DIALOGUE) dialogueEngine.next();
            });
        }

        update() {
            let speed = CONFIG.WALK_SPEED;

            if (game.isAdrenaline) {
                speed = CONFIG.ADRENALINE_SPEED;
            } else if (this.runKey && game.heartStability > CONFIG.CRITICAL_1) {
                speed = CONFIG.RUN_SPEED;
                game.isRunning = true;
            } else {
                game.isRunning = false;
            }

            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            forward.y = 0;
            forward.normalize();

            const side = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
            side.y = 0;
            side.normalize();

            let isMoving = false;

            if (this.moveForward || this.touchMoveVector.y < -0.2) {
                this.position.addScaledVector(forward, speed);
                isMoving = true;
            }
            if (this.moveBackward || this.touchMoveVector.y > 0.2) {
                this.position.addScaledVector(forward, -speed);
                isMoving = true;
            }
            if (this.moveLeft || this.touchMoveVector.x < -0.2) {
                this.position.addScaledVector(side, -speed * 0.7);
                isMoving = true;
            }
            if (this.moveRight || this.touchMoveVector.x > 0.2) {
                this.position.addScaledVector(side, speed * 0.7);
                isMoving = true;
            }

            this.position.x = Math.max(-2.2, Math.min(2.2, this.position.x));
            if (this.position.z > 0) this.position.z = 0;

            if (isMoving) {
                this.stepTimer++;
                if (this.stepTimer > (game.isRunning ? 12 : 22)) {
                    audio.playFootstep();
                    this.stepTimer = 0;
                }
            }

            return isMoving;
        }
    }

    const PROLOGUE_HOME_DIALOGUE = [
        {
            speaker: 'MOTHER',
            text: 'هل أنت جاهز للذهاب إلى المستشفى يا بني؟ العملية اليوم ستنهي سنوات تعبك.',
            choices: [
                { text: 'أنا جاهز يا أمي.', nextPhase: 1 },
                { text: 'أتمنى أن تمر هذه العملية بسلام.', nextPhase: 1 }
            ]
        },
        {
            speaker: 'MOTHER',
            text: 'سنكون جميعاً بجانبك. حان وقت الذهاب لغرفة العمليات.',
            choices: null
        }
    ];

    const PROLOGUE_SURGERY_DIALOGUE = [
        {
            speaker: 'DOCTOR',
            text: 'أهلاً بك في غرفة العمليات. كل شيء جاهز لزراعة القلب الذكي الجديد. خذ نفساً عميقاً... ابدأ التخدير: 3... 2... 1...',
            choices: null
        }
    ];

    const STORY = {
        0: [
            { speaker: 'DOCTOR', text: 'العملية انتهت... هل تسمعني؟ لا تركض كثيراً... قلبك لم يعد طبيعياً.' }
        ],
        1: [
            { speaker: 'RADIO', text: 'تحذير! المفاعل الرئيسي في حالة انهيار!' },
            { speaker: 'RADIO', text: 'إذا كنت تسمعني... لا تتوقف! قلبك مرتبط بالمفاعل.' }
        ],
        2: [
            { speaker: 'PLAYER', text: 'لماذا أصبحت المستشفى فارغة؟' }
        ],
        3: [
            { speaker: 'PLAYER', text: 'هل رأيته؟ ... لا ... هذا مستحيل.' }
        ],
        REACTOR_TWIST: [
            { speaker: 'DOCTOR', text: 'الصدمات الكهربائية الآن! الصدمة الأولى... ثبّتوا النبض!' },
            { speaker: 'PLAYER', text: 'هذا ليس مفاعلاً... هذه غرفة العمليات! إنهم يحاولون إنقاذي!' }
        ],
        ACT2_INTRO: [
            { speaker: 'PLAYER', text: 'أين أنا الآن...؟ ذكرياتي تبدأ بالظهور بكثرة...' }
        ],
        ACT3_COLLAPSE: [
            { speaker: 'PLAYER', text: 'كل شيء ينهار حول نفسي... هذه النقطة الحرجة الحقيقية!' }
        ]
    };

    class DialogueEngine {
        constructor() {
            this.queue = [];
            this.timer = null;
            this.index = 0;
            this.current = null;
        }

        startHomePrologue() {
            game.state = STATE.DIALOGUE;
            game.dom.dialogueBox.classList.remove('hidden');
            this.showHomeStep(0);
        }

        showHomeStep(phaseIndex) {
            const data = PROLOGUE_HOME_DIALOGUE[phaseIndex];
            if (!data) return;

            game.dom.dialogueSpeaker.textContent = data.speaker;
            game.dom.dialogueText.textContent = data.text;
            game.dom.dialogueChoices.innerHTML = '';

            if (data.choices) {
                game.dom.dialogueChoices.classList.remove('hidden');
                data.choices.forEach(ch => {
                    const btn = document.createElement('button');
                    btn.className = 'choice-btn';
                    btn.textContent = ch.text;
                    btn.addEventListener('click', () => {
                        audio.playUIClick();
                        game.dom.dialogueChoices.classList.add('hidden');
                        this.showHomeStep(ch.nextPhase);
                    });
                    game.dom.dialogueChoices.appendChild(btn);
                });
            } else {
                game.dom.dialogueChoices.classList.add('hidden');
                setTimeout(() => {
                    world.buildOperatingRoom();
                    this.showSurgeryStep();
                }, 2000);
            }
        }

        showSurgeryStep() {
            const data = PROLOGUE_SURGERY_DIALOGUE[0];
            game.dom.dialogueSpeaker.textContent = data.speaker;
            game.dom.dialogueText.textContent = data.text;
            game.dom.dialogueChoices.classList.add('hidden');
            this.startAnesthesiaCountdown();
        }

        startAnesthesiaCountdown() {
            game.dom.anesthesiaOverlay.classList.remove('hidden');
            audio.applyAnesthesiaAudioEffect();
            let count = 3;

            const countInterval = setInterval(() => {
                if (count > 0) {
                    game.dom.anesthesiaCountdown.textContent = count;
                    count--;
                } else {
                    clearInterval(countInterval);
                    game.dom.anesthesiaCountdown.textContent = '';
                    setTimeout(() => {
                        game.dom.dialogueBox.classList.add('hidden');
                        game.dom.anesthesiaOverlay.classList.add('hidden');
                        audio.resetAudioEffect();
                        game.dom.loadingScreen.classList.remove('hidden');

                        setTimeout(() => {
                            game.dom.loadingScreen.classList.add('hidden');
                            world.switchToCorridor(CONFIG.ACT3_LENGTH);
                            game.currentAct = 1;
                            game.dom.actIndicator.textContent = "ACT I: NIGHTMARE HOSPITAL";
                            game.state = STATE.PLAYING;
                            this.start(0);
                        }, 3000);
                    }, 1000);
                }
            }, 1000);
        }

        start(key) {
            const lines = STORY[key];
            if (!lines) return;
            this.queue = [...lines];
            game.state = STATE.DIALOGUE;
            game.dom.dialogueBox.classList.remove('hidden');
            this.next();
        }

        next() {
            if (this.queue.length === 0) {
                game.dom.dialogueBox.classList.add('hidden');
                game.state = STATE.PLAYING;
                return;
            }

            this.current = this.queue.shift();
            game.dom.dialogueSpeaker.textContent = this.current.speaker;
            game.dom.dialogueText.textContent = '';
            this.index = 0;

            clearInterval(this.timer);
            this.timer = setInterval(() => {
                if (this.index < this.current.text.length) {
                    game.dom.dialogueText.textContent += this.current.text.charAt(this.index);
                    this.index++;
                } else {
                    clearInterval(this.timer);
                }
            }, 35);
        }
    }

    let audio = new AudioEngine();
    let world, controller, dialogueEngine;

    function applyI18N(lang) {
        settings.lang = lang;
        const dict = I18N[lang] || I18N.ar;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (dict[key]) {
                el.textContent = dict[key];
            }
        });

        if (lang === 'en') {
            game.dom.viewport.classList.remove('lang-ar');
            game.dom.viewport.classList.add('lang-en');
        } else {
            game.dom.viewport.classList.remove('lang-en');
            game.dom.viewport.classList.add('lang-ar');
        }
    }

    function saveGameState() {
        const saveData = {
            act: game.currentAct,
            stability: game.heartStability,
            device: game.selectedDevice,
            settings: settings
        };
        localStorage.setItem('LAST_BEAT_SAVE', JSON.stringify(saveData));
    }

    function loadGameState() {
        const raw = localStorage.getItem('LAST_BEAT_SAVE');
        if (!raw) return false;
        try {
            const parsed = JSON.parse(raw);
            game.currentAct = parsed.act || 1;
            game.heartStability = parsed.stability || 100;
            game.selectedDevice = parsed.device || 'computer';
            return true;
        } catch (e) {
            return false;
        }
    }

    function triggerMemoryFlash(title, msgText) {
        game.dom.memoryTitle.textContent = title;
        game.dom.memoryText.textContent = msgText;
        game.dom.memoryFlashOverlay.classList.remove('hidden');
        setTimeout(() => {
            game.dom.memoryFlashOverlay.classList.add('hidden');
        }, 3500);
    }

    function updateLogic() {
        if (game.state !== STATE.PLAYING && game.state !== STATE.DIALOGUE && game.state !== STATE.PROLOGUE) return;

        if (game.state === STATE.PROLOGUE) {
            world.update(null, false, game.state);
            return;
        }

        const isMoving = controller.update();
        world.update(controller.position, isMoving, game.state);

        const dict = I18N[settings.lang] || I18N.ar;

        if (isMoving) {
            game.dom.movementIndicator.classList.remove('hidden');
            game.dom.moveStatusText.textContent = game.isRunning ? dict.running : dict.walking;
            game.dom.moveStatusDot.style.background = game.isRunning ? '#ff1e43' : '#00ff66';
        } else {
            game.dom.movementIndicator.classList.add('hidden');
        }

        if (game.isRunning) {
            game.heartStability -= 0.08;
        } else if (game.heartStability < CONFIG.MAX_STABILITY) {
            game.heartStability += 0.02;
        }

        game.heartStability = Math.max(0, Math.min(CONFIG.MAX_STABILITY, game.heartStability));
        if (game.heartStability < game.minStability) game.minStability = Math.round(game.heartStability);

        game.bpm = Math.round(72 + (100 - game.heartStability) * 1.15);
        if (game.bpm > game.maxBpm) game.maxBpm = game.bpm;

        if (game.heartStability <= 70 && game.heartStability > 69.8) {
            triggerMemoryFlash("ذكرى الطفولة", "أول مرة دخلت فيها المستشفى طفلاً... والداك يمسكان يدك بابتسامة دافئة.");
        }

        if (game.heartStability <= 40 && game.heartStability > 39.8) {
            triggerMemoryFlash("سنوات المرض", "سنوات طويلة قضيتها بين أجهزة القياس والأسرّة... كنت تقاتل دائماً للعيش.");
        }

        if (game.heartStability <= CONFIG.CRITICAL_1 && !game.isCritical) {
            game.isCritical = true;
            game.dom.vignetteCritical.classList.remove('hidden');
            game.dom.blurOverlay.classList.remove('hidden');
            audio.startTinnitus();
            game.cameraShake = 0.18;
            dialogueEngine.start('CRITICAL_20');
        }

        if (game.heartStability <= CONFIG.CRITICAL_2 && !game.isAdrenaline) {
            game.isAdrenaline = true;
        }

        const z = Math.abs(controller.position.z);

        if (z > 40 && z < 48 && !game.hasKeycard) {
            game.dom.interactPrompt.classList.remove('hidden');
            if (controller.runKey || touchCheckInteract()) {
                game.hasKeycard = true;
                game.dom.keycardBadge.classList.remove('hidden');
                game.dom.interactPrompt.classList.add('hidden');
            }
        } else {
            game.dom.interactPrompt.classList.add('hidden');
        }

        if (z > 15 && !game.blackout) {
            game.blackout = true;
            world.triggerBlackout();
            audio.playSpark();
            game.dom.screenFlash.style.opacity = '1';
            setTimeout(() => game.dom.screenFlash.style.opacity = '0', 80);
            dialogueEngine.start(1);
        }

        if (z > 60 && !game.hallucinationActive) {
            game.hallucinationActive = true;
            dialogueEngine.start(3);
        }

        if (z > CONFIG.ACT1_LENGTH && !game.act2Triggered) {
            game.act2Triggered = true;
            game.currentAct = 2;
            game.dom.actIndicator.textContent = "ACT II: THE MIND WORLD";
            world.transformToAct2World();
            dialogueEngine.start('REACTOR_TWIST');
            saveGameState();
        }

        if (z > CONFIG.ACT2_LENGTH && !game.act3Triggered) {
            game.act3Triggered = true;
            game.currentAct = 3;
            game.dom.actIndicator.textContent = "ACT III: TRUE CRITICAL POINT";
            game.dom.worldCollapseOverlay.classList.remove('hidden');
            world.transformToAct3Collapse();
            dialogueEngine.start('ACT3_COLLAPSE');
            saveGameState();
        }

        if (z > CONFIG.ACT3_LENGTH && !game.reactorReached) {
            game.reactorReached = true;
            triggerEnding(true);
        }

        if (game.heartStability <= 0) {
            triggerEnding(false);
        }

        updateHUD();
    }

    function touchCheckInteract() {
        return false;
    }

    function updateHUD() {
        game.dom.txtStability.textContent = `${Math.round(game.heartStability)}%`;
        game.dom.stBarFill.style.width = `${game.heartStability}%`;
        game.dom.txtBpm.textContent = game.bpm;

        if (game.heartStability <= CONFIG.CRITICAL_1) {
            game.dom.stBarFill.style.background = '#ff1e43';
        } else {
            game.dom.stBarFill.style.background = '#00ff66';
        }

        drawHUDecg();
    }

    function drawHUDecg() {
        const ctx = game.hudEcgCtx;
        if (!ctx) return;

        ctx.clearRect(0, 0, 150, 40);
        ctx.strokeStyle = game.isCritical ? '#ff1e43' : '#00ff66';
        ctx.lineWidth = 2;

        ctx.beginPath();
        const time = Date.now() * 0.006 * (game.bpm / 60);
        ctx.moveTo(0, 20);

        for (let x = 0; x < 150; x += 5) {
            const y = 20 + Math.sin(x * 0.12 + time) * (game.isCritical ? 10 : 4);
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    function triggerEnding(isGood) {
        game.state = STATE.ENDING;
        audio.stopTinnitus();

        game.dom.endingOverlay.classList.remove('hidden');
        game.dom.hudOverlay.classList.add('hidden');

        if (isGood) {
            game.dom.endingTitle.textContent = settings.lang === 'en' ? "STABLE PULSE - RETURN TO LIFE" : "استقرار النبض والعودة للحياة";
            game.dom.endingStory.textContent = settings.lang === 'en' ? "You reached your true heart core and held onto the will to live. Electrophysiology shock succeeded and your new smart heart stabilized under doctor care." : "وصلت لنواة قلبك الحقيقي واستجمعت إرادتك للحياة... في غرفة العمليات نجحت الصدمات الكهربائية واستقرت دقات قلبك الذكي الجديد برعايتها للأطباء. تم الاستيقاظ بنجاح.";
        } else {
            game.dom.endingTitle.textContent = settings.lang === 'en' ? "HEART FAILURE" : "توقف القلب والانهيار";
            game.dom.endingStory.textContent = settings.lang === 'en' ? "Your heart stability completely failed during the psychological struggle. The ECG line flatlined silently in the operating room." : "توقف استقرار قلبك تماماً أثناء المعركة النفسية... تحول مؤشر شاشة ECG في غرفة العمليات لخط مستقيم صامت ينعى نهاية الرحلة.";
        }
    }

    function gameLoop() {
        updateLogic();
        requestAnimationFrame(gameLoop);
    }

    function initUI() {
        game.dom = {
            viewport: document.getElementById('gameViewport'),
            warningModal: document.getElementById('warningModal'),
            btnWarningAgree: document.getElementById('btnWarningAgree'),
            mainMenu: document.getElementById('mainMenu'),
            btnMenuPlay: document.getElementById('btnMenuPlay'),
            btnMenuContinue: document.getElementById('btnMenuContinue'),
            btnMenuSettings: document.getElementById('btnMenuSettings'),
            btnMenuDevs: document.getElementById('btnMenuDevs'),
            btnMenuExit: document.getElementById('btnMenuExit'),
            developersModal: document.getElementById('developersModal'),
            btnCloseDevs: document.getElementById('btnCloseDevs'),
            settingsModal: document.getElementById('settingsModal'),
            btnCloseSettings: document.getElementById('btnCloseSettings'),
            btnToggleLang: document.getElementById('btnToggleLang'),
            sliderMasterVol: document.getElementById('sliderMasterVol'),
            sliderMusicVol: document.getElementById('sliderMusicVol'),
            sliderHeartVol: document.getElementById('sliderHeartVol'),
            chkVibration: document.getElementById('chkVibration'),
            btnToggleFullscreen: document.getElementById('btnToggleFullscreen'),
            loadingScreen: document.getElementById('loadingScreen'),
            deviceModal: document.getElementById('deviceModal'),
            btnStartGame: document.getElementById('btnStartGame'),
            hudOverlay: document.getElementById('hudOverlay'),
            dialogueBox: document.getElementById('dialogueBox'),
            dialogueSpeaker: document.getElementById('dialogueSpeaker'),
            dialogueText: document.getElementById('dialogueText'),
            dialogueChoices: document.getElementById('dialogueChoicesContainer'),
            touchControls: document.getElementById('touchControls'),
            txtStability: document.getElementById('txtStability'),
            stBarFill: document.getElementById('stBarFill'),
            txtBpm: document.getElementById('txtBpm'),
            actIndicator: document.getElementById('actIndicator'),
            keycardBadge: document.getElementById('keycardBadge'),
            interactPrompt: document.getElementById('interactPrompt'),
            movementIndicator: document.getElementById('movementIndicator'),
            moveStatusDot: document.getElementById('moveStatusDot'),
            moveStatusText: document.getElementById('moveStatusText'),
            vignetteCritical: document.getElementById('vignetteCritical'),
            blurOverlay: document.getElementById('blurOverlay'),
            anesthesiaOverlay: document.getElementById('anesthesiaOverlay'),
            anesthesiaCountdown: document.getElementById('anesthesiaCountdown'),
            worldCollapseOverlay: document.getElementById('worldCollapseOverlay'),
            memoryFlashOverlay: document.getElementById('memoryFlashOverlay'),
            memoryTitle: document.getElementById('memoryTitle'),
            memoryText: document.getElementById('memoryText'),
            screenFlash: document.getElementById('screenFlash'),
            crosshair: document.getElementById('crosshair'),
            endingOverlay: document.getElementById('endingOverlay'),
            endingTitle: document.getElementById('endingTitle'),
            endingStory: document.getElementById('endingStory'),
            btnRestart: document.getElementById('btnRestart')
        };

        game.hudEcgCtx = document.getElementById('hudEcgCanvas').getContext('2d');

        if (loadGameState()) {
            game.dom.btnMenuContinue.classList.remove('hidden');
        }

        game.dom.btnWarningAgree.addEventListener('click', () => {
            audio.init(settings);
            audio.playUIClick();
            game.dom.warningModal.classList.add('hidden');
            game.dom.mainMenu.classList.remove('hidden');
            game.state = STATE.MENU;
        });

        game.dom.btnMenuPlay.addEventListener('click', () => {
            audio.playUIClick();
            audio.startAmbient();
            game.dom.mainMenu.classList.add('hidden');
            game.dom.deviceModal.classList.remove('hidden');
            game.state = STATE.DEVICE_SELECT;
        });

        game.dom.btnMenuContinue.addEventListener('click', () => {
            audio.playUIClick();
            audio.startAmbient();
            game.dom.mainMenu.classList.add('hidden');
            game.dom.deviceModal.classList.remove('hidden');
            game.state = STATE.DEVICE_SELECT;
        });

        game.dom.btnMenuSettings.addEventListener('click', () => {
            audio.playUIClick();
            game.dom.mainMenu.classList.add('hidden');
            game.dom.settingsModal.classList.remove('hidden');
        });

        game.dom.btnCloseSettings.addEventListener('click', () => {
            audio.playUIClick();
            game.dom.settingsModal.classList.add('hidden');
            game.dom.mainMenu.classList.remove('hidden');
        });

        game.dom.btnToggleLang.addEventListener('click', () => {
            audio.playUIClick();
            const newLang = settings.lang === 'ar' ? 'en' : 'ar';
            applyI18N(newLang);
        });

        game.dom.btnMenuDevs.addEventListener('click', () => {
            audio.playUIClick();
            game.dom.mainMenu.classList.add('hidden');
            game.dom.developersModal.classList.remove('hidden');
        });

        game.dom.btnCloseDevs.addEventListener('click', () => {
            audio.playUIClick();
            game.dom.developersModal.classList.add('hidden');
            game.dom.mainMenu.classList.remove('hidden');
        });

        game.dom.btnMenuExit.addEventListener('click', () => {
            audio.playUIClick();
            window.close();
        });

        game.dom.sliderMasterVol.addEventListener('input', (e) => {
            settings.masterVol = e.target.value / 100;
            audio.updateVolumes(settings);
        });

        game.dom.sliderMusicVol.addEventListener('input', (e) => {
            settings.musicVol = e.target.value / 100;
            audio.updateVolumes(settings);
        });

        game.dom.sliderHeartVol.addEventListener('input', (e) => {
            settings.heartVol = e.target.value / 100;
            audio.updateVolumes(settings);
        });

        game.dom.chkVibration.addEventListener('change', (e) => {
            settings.vibration = e.target.checked;
        });

        game.dom.btnToggleFullscreen.addEventListener('click', () => {
            audio.playUIClick();
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });

        document.querySelectorAll('.device-option-box').forEach(box => {
            box.addEventListener('click', () => {
                audio.playUIClick();
                document.querySelectorAll('.device-option-box').forEach(b => b.classList.remove('active-dev'));
                box.classList.add('active-dev');
                game.selectedDevice = box.dataset.device;
            });
        });

        game.dom.btnStartGame.addEventListener('click', () => {
            audio.playUIClick();
            game.dom.deviceModal.classList.add('hidden');
            game.dom.viewport.className = `device-${game.selectedDevice} lang-${settings.lang}`;

            if (game.selectedDevice !== 'computer') {
                game.dom.touchControls.classList.remove('hidden');
            } else {
                game.dom.crosshair.classList.remove('hidden');
            }

            world = new World3D();
            controller = new FirstPersonController(world.camera);
            dialogueEngine = new DialogueEngine();

            game.state = STATE.PROLOGUE;
            dialogueEngine.startHomePrologue();

            setInterval(() => {
                if (game.state === STATE.PLAYING || game.state === STATE.CRITICAL) {
                    audio.playHeartbeat(game.isCritical ? 1.4 : 0.85, settings.vibration);
                    game.cameraShake = game.isCritical ? 0.08 : 0.02;
                }
            }, (60 / game.bpm) * 1000);

            requestAnimationFrame(gameLoop);
        });

        game.dom.btnRestart.addEventListener('click', () => {
            audio.playUIClick();
            window.location.reload();
        });

        applyI18N('ar');
    }

    window.addEventListener('DOMContentLoaded', initUI);

})();