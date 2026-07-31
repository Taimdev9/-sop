(function () {
    'use strict';

    const STATE = {
        INIT: 0,
        MENU: 1,
        SETTINGS: 2,
        DEVELOPERS: 3,
        LOADING: 4,
        DEVICE_SELECT: 5,
        PROLOGUE: 6,
        PLAYING: 7,
        DIALOGUE: 8,
        CRITICAL: 9,
        ENDING: 10
    };

    const CONFIG = {
        MAX_STABILITY: 100,
        CRITICAL_1: 20,
        CRITICAL_2: 15,
        FATAL: 5,
        WALK_SPEED: 0.12,
        RUN_SPEED: 0.22,
        ADRENALINE_SPEED: 0.32,
        WORLD_LENGTH: 280
    };

    const settings = {
        masterVol: 0.8,
        musicVol: 0.7,
        heartVol: 1.0,
        vibration: true
    };

    const game = {
        state: STATE.INIT,
        selectedDevice: 'computer',
        heartStability: 100,
        bpm: 72,
        isRunning: false,
        isCritical: false,
        isAdrenaline: false,
        blackout: false,
        hallucinationActive: false,
        reactorReached: false,
        cameraShake: 0,
        maxBpm: 72,
        minStability: 100,
        prologuePhase: 0,
        dom: {},
        hudEcgCtx: null
    };

    class AudioEngine {
        constructor() {
            this.ctx = null;
            this.unlocked = false;
            this.masterGain = null;
            this.musicGain = null;
            this.heartGain = null;
            this.tinnitusNode = null;
            this.droneNode = null;
        }

        init() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioContext();
                
                this.masterGain = this.ctx.createGain();
                this.musicGain = this.ctx.createGain();
                this.heartGain = this.ctx.createGain();

                this.updateVolumes();

                this.musicGain.connect(this.masterGain);
                this.heartGain.connect(this.masterGain);
                this.masterGain.connect(this.ctx.destination);

                this.unlocked = true;
                return true;
            } catch (e) {
                return false;
            }
        }

        updateVolumes() {
            if (!this.ctx) return;
            this.masterGain.gain.setValueAtTime(settings.masterVol, this.ctx.currentTime);
            this.musicGain.gain.setValueAtTime(settings.musicVol, this.ctx.currentTime);
            this.heartGain.gain.setValueAtTime(settings.heartVol, this.ctx.currentTime);
        }

        playHeartbeat(intensity) {
            if (!this.unlocked || !this.ctx) return;
            const now = this.ctx.currentTime;
            
            const osc1 = this.ctx.createOscillator();
            const g1 = this.ctx.createGain();
            const f1 = this.ctx.createBiquadFilter();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(55, now);
            osc1.frequency.exponentialRampToValueAtTime(18, now + 0.12);

            f1.type = 'lowpass';
            f1.frequency.setValueAtTime(110, now);

            g1.gain.setValueAtTime(0, now);
            g1.gain.linearRampToValueAtTime(1.3 * intensity, now + 0.02);
            g1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc1.connect(f1);
            f1.connect(g1);
            g1.connect(this.heartGain);

            osc1.start(now);
            osc1.stop(now + 0.15);

            const delay2 = now + 0.11;
            const osc2 = this.ctx.createOscillator();
            const g2 = this.ctx.createGain();
            const f2 = this.ctx.createBiquadFilter();

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(70, delay2);
            osc2.frequency.exponentialRampToValueAtTime(22, delay2 + 0.1);

            f2.type = 'lowpass';
            f2.frequency.setValueAtTime(130, delay2);

            g2.gain.setValueAtTime(0, delay2);
            g2.gain.linearRampToValueAtTime(0.9 * intensity, delay2 + 0.02);
            g2.gain.exponentialRampToValueAtTime(0.001, delay2 + 0.12);

            osc2.connect(f2);
            f2.connect(g2);
            g2.connect(this.heartGain);

            osc2.start(delay2);
            osc2.stop(delay2 + 0.13);

            if (settings.vibration && navigator.vibrate) {
                navigator.vibrate(40);
            }
        }

        startTinnitus() {
            if (!this.unlocked || this.tinnitusNode) return;
            const now = this.ctx.currentTime;
            this.tinnitusNode = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            this.tinnitusNode.type = 'sine';
            this.tinnitusNode.frequency.setValueAtTime(3600, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.12, now + 1.2);

            this.tinnitusNode.connect(gain);
            gain.connect(this.masterGain);

            this.tinnitusNode.start(now);
            this.tinnitusNode.gainRef = gain;
        }

        stopTinnitus() {
            if (this.tinnitusNode) {
                const now = this.ctx.currentTime;
                this.tinnitusNode.gainRef.gain.linearRampToValueAtTime(0.001, now + 0.4);
                setTimeout(() => {
                    if (this.tinnitusNode) {
                        this.tinnitusNode.stop();
                        this.tinnitusNode = null;
                    }
                }, 400);
            }
        }

        startAmbient() {
            if (!this.unlocked || this.droneNode) return;
            const now = this.ctx.currentTime;
            this.droneNode = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            this.droneNode.type = 'sawtooth';
            this.droneNode.frequency.setValueAtTime(40, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(80, now);

            gain.gain.setValueAtTime(0.1, now);

            this.droneNode.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            this.droneNode.start(now);
        }

        playSpark() {
            if (!this.unlocked) return;
            const bufSize = this.ctx.sampleRate * 0.08;
            const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(2200, this.ctx.currentTime);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.07);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            noise.start();
        }

        playFootstep() {
            if (!this.unlocked) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(25, now + 0.04);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 0.05);
        }

        playCustomVoice(audioPath) {
            if (!this.unlocked) return;
            const audioObj = new Audio(audioPath);
            audioObj.volume = settings.masterVol;
            audioObj.play().catch(() => {});
        }
    }

    const audio = new AudioEngine();

    class World3D {
        constructor() {
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
            
            this.lights = [];
            this.hallucinationMesh = null;
            this.operatingRoomGroup = null;
            this.corridorGroup = null;
            this.bobTimer = 0;

            this.init();
        }

        init() {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;

            document.getElementById('threeCanvasContainer').appendChild(this.renderer.domElement);

            this.scene.background = new THREE.Color(0x0a0f18);
            this.camera.position.set(0, 1.6, 0);

            this.buildOperatingRoom();

            window.addEventListener('resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            });
        }

        buildOperatingRoom() {
            this.operatingRoomGroup = new THREE.Group();

            const wallMat = new THREE.MeshStandardMaterial({ color: 0x2b3e50, roughness: 0.3 });
            const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e2d3b, roughness: 0.2 });

            const roomGeo = new THREE.BoxGeometry(10, 4, 10);
            const room = new THREE.Mesh(roomGeo, wallMat);
            room.position.set(0, 2, 0);
            this.operatingRoomGroup.add(room);

            const floorGeo = new THREE.PlaneGeometry(10, 10);
            const floor = new THREE.Mesh(floorGeo, floorMat);
            floor.rotation.x = -Math.PI / 2;
            floor.position.set(0, 0.01, 0);
            this.operatingRoomGroup.add(floor);

            const surgLight = new THREE.SpotLight(0xffffff, 2.5);
            surgLight.position.set(0, 3.8, 0);
            surgLight.angle = Math.PI / 3;
            surgLight.penumbra = 0.5;
            this.operatingRoomGroup.add(surgLight);

            const docGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.7);
            const docMat = new THREE.MeshStandardMaterial({ color: 0x00a896 });
            
            const doc1 = new THREE.Mesh(docGeo, docMat);
            doc1.position.set(-1.2, 0.85, -0.5);
            this.operatingRoomGroup.add(doc1);

            const doc2 = new THREE.Mesh(docGeo, docMat);
            doc2.position.set(1.2, 0.85, -0.5);
            this.operatingRoomGroup.add(doc2);

            this.scene.add(this.operatingRoomGroup);
            this.camera.position.set(0, 0.8, 0.5);
            this.camera.rotation.set(-Math.PI / 4, 0, 0);
        }

        switchToCorridor() {
            if (this.operatingRoomGroup) {
                this.scene.remove(this.operatingRoomGroup);
            }

            this.corridorGroup = new THREE.Group();
            this.scene.background = new THREE.Color(0x020304);
            this.scene.fog = new THREE.FogExp2(0x020304, 0.045);

            const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a222d, roughness: 0.8 });
            const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0e14, roughness: 0.4 });
            const doorMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.5 });

            const floorGeo = new THREE.PlaneGeometry(6, CONFIG.WORLD_LENGTH);
            const floor = new THREE.Mesh(floorGeo, floorMat);
            floor.rotation.x = -Math.PI / 2;
            floor.position.set(0, 0, -CONFIG.WORLD_LENGTH / 2);
            this.corridorGroup.add(floor);

            const wallGeo = new THREE.PlaneGeometry(CONFIG.WORLD_LENGTH, 3);

            const leftWall = new THREE.Mesh(wallGeo, wallMat);
            leftWall.rotation.y = Math.PI / 2;
            leftWall.position.set(-3, 1.5, -CONFIG.WORLD_LENGTH / 2);
            this.corridorGroup.add(leftWall);

            const rightWall = new THREE.Mesh(wallGeo, wallMat);
            rightWall.rotation.y = -Math.PI / 2;
            rightWall.position.set(3, 1.5, -CONFIG.WORLD_LENGTH / 2);
            this.corridorGroup.add(rightWall);

            for (let z = -10; z > -CONFIG.WORLD_LENGTH + 20; z -= 15) {
                const doorGeo = new THREE.BoxGeometry(0.1, 2.2, 1.2);
                const leftDoor = new THREE.Mesh(doorGeo, doorMat);
                leftDoor.position.set(-2.95, 1.1, z);
                this.corridorGroup.add(leftDoor);

                const light = new THREE.PointLight(0x00ff66, 0.8, 12);
                light.position.set(0, 2.8, z);
                this.corridorGroup.add(light);
                this.lights.push(light);
            }

            const shadowGeo = new THREE.BoxGeometry(0.8, 1.8, 0.3);
            const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
            this.hallucinationMesh = new THREE.Mesh(shadowGeo, shadowMat);
            this.hallucinationMesh.position.set(0, 0.9, -100);
            this.corridorGroup.add(this.hallucinationMesh);

            this.scene.add(this.corridorGroup);
            this.camera.rotation.set(0, 0, 0);
            this.camera.position.set(0, 1.6, 0);
        }

        triggerBlackout() {
            this.lights.forEach(light => {
                light.color.setHex(0xff1e43);
                light.intensity = 0.15;
            });
            this.scene.fog.color.setHex(0x010102);
            this.scene.background.setHex(0x010102);
        }

        update(playerPos, isMoving) {
            if (game.state === STATE.PROLOGUE) {
                this.renderer.render(this.scene, this.camera);
                return;
            }

            this.camera.position.x = playerPos.x;
            this.camera.position.z = playerPos.z;

            if (isMoving) {
                this.bobTimer += game.isRunning ? 0.25 : 0.15;
                this.camera.position.y = 1.6 + Math.sin(this.bobTimer) * 0.05;
            } else {
                this.camera.position.y = 1.6;
            }

            if (game.cameraShake > 0) {
                this.camera.position.x += (Math.random() - 0.5) * game.cameraShake;
                this.camera.position.y += (Math.random() - 0.5) * game.cameraShake;
                game.cameraShake *= 0.9;
            }

            if (game.hallucinationActive && this.hallucinationMesh) {
                const dist = Math.abs(playerPos.z - this.hallucinationMesh.position.z);
                if (dist < 20 && dist > 2) {
                    this.hallucinationMesh.material.opacity = Math.min(0.9, (20 - dist) / 10);
                } else {
                    this.hallucinationMesh.material.opacity = 0;
                }
            }

            this.renderer.render(this.scene, this.camera);
        }
    }

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
            });

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
            });

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
            });

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
            });

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

    const PROLOGUE_DIALOGUE = [
        {
            speaker: 'DOCTOR',
            text: 'هل أنت مستعد للعملية الجراحية؟',
            choices: [
                { text: 'أنا خائف قليلاً...', nextPhase: 1 },
                { text: 'أريد أن تنتهي هذه الليلة فقط.', nextPhase: 1 },
                { text: 'هل سأعيش حياة طبيعية بعدها؟', nextPhase: 1 }
            ]
        },
        {
            speaker: 'DOCTOR',
            text: 'نعرف أنك انتظرت هذا اليوم سنوات طويلة. كل شيء جاهز، ابدأ التخدير...',
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
        CRITICAL_20: [
            { speaker: 'PLAYER', text: 'لا... ليس الآن...' }
        ]
    };

    class DialogueEngine {
        constructor() {
            this.queue = [];
            this.timer = null;
            this.index = 0;
            this.current = null;
        }

        startPrologue() {
            game.state = STATE.DIALOGUE;
            game.dom.dialogueBox.classList.remove('hidden');
            this.showPrologueStep(0);
        }

        showPrologueStep(phaseIndex) {
            const data = PROLOGUE_DIALOGUE[phaseIndex];
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
                        game.dom.dialogueChoices.classList.add('hidden');
                        this.showPrologueStep(ch.nextPhase);
                    });
                    game.dom.dialogueChoices.appendChild(btn);
                });
            } else {
                game.dom.dialogueChoices.classList.add('hidden');
                setTimeout(() => {
                    this.startAnesthesiaTransition();
                }, 2000);
            }
        }

        startAnesthesiaTransition() {
            game.dom.anesthesiaOverlay.classList.remove('hidden');
            setTimeout(() => {
                game.dom.dialogueBox.classList.add('hidden');
                game.dom.anesthesiaOverlay.classList.add('hidden');
                
                game.dom.loadingScreen.classList.remove('hidden');

                setTimeout(() => {
                    game.dom.loadingScreen.classList.add('hidden');
                    world.switchToCorridor();
                    game.state = STATE.PLAYING;
                    this.start(0);
                }, 3000);
            }, 3500);
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

    let world, controller, dialogueEngine;

    function triggerMemoryFlash(msgText) {
        game.dom.memoryText.textContent = msgText;
        game.dom.memoryFlashOverlay.classList.remove('hidden');
        setTimeout(() => {
            game.dom.memoryFlashOverlay.classList.add('hidden');
        }, 3000);
    }

    function updateLogic() {
        if (game.state !== STATE.PLAYING && game.state !== STATE.DIALOGUE && game.state !== STATE.PROLOGUE) return;

        if (game.state === STATE.PROLOGUE) {
            world.update(null, false);
            return;
        }

        const isMoving = controller.update();
        world.update(controller.position, isMoving);

        if (game.isRunning) {
            game.heartStability -= 0.09;
        } else if (game.heartStability < CONFIG.MAX_STABILITY) {
            game.heartStability += 0.02;
        }

        game.heartStability = Math.max(0, Math.min(CONFIG.MAX_STABILITY, game.heartStability));
        if (game.heartStability < game.minStability) game.minStability = Math.round(game.heartStability);

        game.bpm = Math.round(72 + (100 - game.heartStability) * 1.15);
        if (game.bpm > game.maxBpm) game.maxBpm = game.bpm;

        if (game.heartStability <= 50 && game.heartStability > 49.8) {
            triggerMemoryFlash("ذكرى: عندما كنت طفلاً في المستشفى... كنت تحلم بالركض بحرية.");
        }

        if (game.heartStability <= CONFIG.CRITICAL_1 && !game.isCritical) {
            game.isCritical = true;
            game.dom.vignetteCritical.classList.remove('hidden');
            game.dom.blurOverlay.classList.remove('hidden');
            audio.startTinnitus();
            game.cameraShake = 0.15;
            dialogueEngine.start('CRITICAL_20');
        }

        if (game.heartStability <= CONFIG.CRITICAL_2 && !game.isAdrenaline) {
            game.isAdrenaline = true;
        }

        const z = Math.abs(controller.position.z);

        if (z > 15 && !game.blackout) {
            game.blackout = true;
            world.triggerBlackout();
            audio.playSpark();
            game.dom.screenFlash.style.opacity = '1';
            setTimeout(() => game.dom.screenFlash.style.opacity = '0', 80);
            dialogueEngine.start(1);
        }

        if (z > 80 && !game.hallucinationActive) {
            game.hallucinationActive = true;
            dialogueEngine.start(3);
        }

        if (z > 240 && !game.reactorReached) {
            game.reactorReached = true;
            triggerEnding(true);
        }

        if (game.heartStability <= 0) {
            triggerEnding(false);
        }

        updateHUD();
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
            game.dom.endingTitle.textContent = "استقرار النبض";
            game.dom.endingStory.textContent = "لم يكن هناك مفاعل اصطناعي... كل تلك الأروقة والظلال المظلمة كانت معركة داخل عقلك أثناء محاولة الأطباء إنعاش قلبك على طاولة العملية. نجحت العملية وعادت المؤشرات للحياة بنجاح.";
        } else {
            game.dom.endingTitle.textContent = "توقف القلب";
            game.dom.endingStory.textContent = "توقف القلب تماماً عن النبض... انتهت المحاولات الطبية بخط مستقيم صامت.";
        }
    }

    function gameLoop() {
        updateLogic();
        requestAnimationFrame(gameLoop);
    }

    function initUI() {
        game.dom = {
            viewport: document.getElementById('gameViewport'),
            mainMenu: document.getElementById('mainMenu'),
            btnMenuStart: document.getElementById('btnMenuStart'),
            btnMenuSettings: document.getElementById('btnMenuSettings'),
            btnMenuDevs: document.getElementById('btnMenuDevs'),
            btnMenuExit: document.getElementById('btnMenuExit'),
            developersModal: document.getElementById('developersModal'),
            btnCloseDevs: document.getElementById('btnCloseDevs'),
            settingsModal: document.getElementById('settingsModal'),
            btnCloseSettings: document.getElementById('btnCloseSettings'),
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
            vignetteCritical: document.getElementById('vignetteCritical'),
            blurOverlay: document.getElementById('blurOverlay'),
            anesthesiaOverlay: document.getElementById('anesthesiaOverlay'),
            memoryFlashOverlay: document.getElementById('memoryFlashOverlay'),
            memoryText: document.getElementById('memoryText'),
            screenFlash: document.getElementById('screenFlash'),
            crosshair: document.getElementById('crosshair'),
            endingOverlay: document.getElementById('endingOverlay'),
            endingTitle: document.getElementById('endingTitle'),
            endingStory: document.getElementById('endingStory'),
            btnRestart: document.getElementById('btnRestart')
        };

        game.hudEcgCtx = document.getElementById('hudEcgCanvas').getContext('2d');

        game.dom.btnMenuStart.addEventListener('click', () => {
            audio.init();
            audio.startAmbient();
            game.dom.mainMenu.classList.add('hidden');
            game.dom.deviceModal.classList.remove('hidden');
        });

        game.dom.btnMenuSettings.addEventListener('click', () => {
            game.dom.mainMenu.classList.add('hidden');
            game.dom.settingsModal.classList.remove('hidden');
        });

        game.dom.btnCloseSettings.addEventListener('click', () => {
            game.dom.settingsModal.classList.add('hidden');
            game.dom.mainMenu.classList.remove('hidden');
        });

        game.dom.btnMenuDevs.addEventListener('click', () => {
            game.dom.mainMenu.classList.add('hidden');
            game.dom.developersModal.classList.remove('hidden');
        });

        game.dom.btnCloseDevs.addEventListener('click', () => {
            game.dom.developersModal.classList.add('hidden');
            game.dom.mainMenu.classList.remove('hidden');
        });

        game.dom.btnMenuExit.addEventListener('click', () => {
            window.close();
        });

        game.dom.sliderMasterVol.addEventListener('input', (e) => {
            settings.masterVol = e.target.value / 100;
            audio.updateVolumes();
        });

        game.dom.sliderMusicVol.addEventListener('input', (e) => {
            settings.musicVol = e.target.value / 100;
            audio.updateVolumes();
        });

        game.dom.sliderHeartVol.addEventListener('input', (e) => {
            settings.heartVol = e.target.value / 100;
            audio.updateVolumes();
        });

        game.dom.chkVibration.addEventListener('change', (e) => {
            settings.vibration = e.target.checked;
        });

        game.dom.btnToggleFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });

        document.querySelectorAll('.device-option-box').forEach(box => {
            box.addEventListener('click', () => {
                document.querySelectorAll('.device-option-box').forEach(b => b.classList.remove('active-dev'));
                box.classList.add('active-dev');
                game.selectedDevice = box.dataset.device;
            });
        });

        game.dom.btnStartGame.addEventListener('click', () => {
            game.dom.deviceModal.classList.add('hidden');
            game.dom.viewport.className = `device-${game.selectedDevice}`;

            if (game.selectedDevice !== 'computer') {
                game.dom.touchControls.classList.remove('hidden');
            } else {
                game.dom.crosshair.classList.remove('hidden');
            }

            world = new World3D();
            controller = new FirstPersonController(world.camera);
            dialogueEngine = new DialogueEngine();

            game.state = STATE.PROLOGUE;
            dialogueEngine.startPrologue();

            setInterval(() => {
                if (game.state === STATE.PLAYING || game.state === STATE.CRITICAL) {
                    audio.playHeartbeat(game.isCritical ? 1.4 : 0.85);
                    game.cameraShake = game.isCritical ? 0.08 : 0.02;
                }
            }, (60 / game.bpm) * 1000);

            requestAnimationFrame(gameLoop);
        });

        game.dom.btnRestart.addEventListener('click', () => {
            window.location.reload();
        });
    }

    window.addEventListener('DOMContentLoaded', initUI);

})();