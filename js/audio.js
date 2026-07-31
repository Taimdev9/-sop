class AudioEngine {
    constructor() {
        this.ctx = null;
        this.unlocked = false;
        this.masterGain = null;
        this.musicGain = null;
        this.heartGain = null;
        this.tinnitusNode = null;
        this.droneNode = null;
        this.lowpassFilter = null;
    }

    init(settings) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            this.masterGain = this.ctx.createGain();
            this.musicGain = this.ctx.createGain();
            this.heartGain = this.ctx.createGain();

            this.lowpassFilter = this.ctx.createBiquadFilter();
            this.lowpassFilter.type = 'lowpass';
            this.lowpassFilter.frequency.setValueAtTime(20000, this.ctx.currentTime);

            this.updateVolumes(settings);

            this.musicGain.connect(this.lowpassFilter);
            this.heartGain.connect(this.lowpassFilter);
            this.lowpassFilter.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);

            this.unlocked = true;
            return true;
        } catch (e) {
            return false;
        }
    }

    updateVolumes(settings) {
        if (!this.ctx) return;
        this.masterGain.gain.setValueAtTime(settings.masterVol, this.ctx.currentTime);
        this.musicGain.gain.setValueAtTime(settings.musicVol, this.ctx.currentTime);
        this.heartGain.gain.setValueAtTime(settings.heartVol, this.ctx.currentTime);
    }

    applyAnesthesiaAudioEffect() {
        if (!this.ctx) return;
        this.lowpassFilter.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 3.0);
    }

    resetAudioEffect() {
        if (!this.ctx) return;
        this.lowpassFilter.frequency.setValueAtTime(20000, this.ctx.currentTime);
    }

    playUIClick() {
        if (!this.unlocked || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    playHeartbeat(intensity, vibration) {
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

        if (vibration && navigator.vibrate) {
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
}