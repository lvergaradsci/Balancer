// sound.js - Sistema de Audio ASMR Industrial-Toy

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.ambientLoop = null;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.isInitialized = false;
    }

    // Inicializar el contexto de audio
    init() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isInitialized = true;
            console.log('🔊 Sistema de audio inicializado');
        } catch (e) {
            console.warn('Audio no disponible:', e);
        }
    }

    // Crear tono sintético (Web Audio API)
    createTone(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        // Envelope ADSR
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.sfxVolume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // Sonido de click metálico (botones)
    playClick() {
        this.createTone(800, 0.1, 'square');
        setTimeout(() => this.createTone(600, 0.05, 'square'), 50);
    }

    // Sonido de éxito (acción correcta)
    playSuccess() {
        this.createTone(523.25, 0.1, 'sine'); // C5
        setTimeout(() => this.createTone(659.25, 0.1, 'sine'), 100); // E5
        setTimeout(() => this.createTone(783.99, 0.2, 'sine'), 200); // G5
    }

    // Sonido de error
    playError() {
        this.createTone(200, 0.15, 'sawtooth');
        setTimeout(() => this.createTone(150, 0.2, 'sawtooth'), 150);
    }

    // Burbuja de agua (para fluidos)
    playBubble() {
        const freq = 300 + Math.random() * 200;
        this.createTone(freq, 0.08, 'sine');
    }

    // Válvula girando (control hidráulico)
    playValve() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        
        const now = this.audioContext.currentTime;
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.linearRampToValueAtTime(80, now + 0.3);
        
        gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }

    // Engranaje girando (mecánico)
    playGear() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createTone(400 + (i * 50), 0.05, 'square');
            }, i * 50);
        }
    }

    // Combo multiplicador aumentando
    playCombo(multiplier) {
        const baseFreq = 440;
        const freq = baseFreq * multiplier;
        this.createTone(freq, 0.15, 'triangle');
        
        // Efecto de brillo
        setTimeout(() => this.createTone(freq * 2, 0.1, 'sine'), 100);
    }

    // Victoria del nivel
    playVictory() {
        const melody = [
            { freq: 523.25, time: 0 },    // C5
            { freq: 659.25, time: 150 },  // E5
            { freq: 783.99, time: 300 },  // G5
            { freq: 1046.50, time: 450 }, // C6
            { freq: 783.99, time: 600 },  // G5
            { freq: 1046.50, time: 750 }  // C6
        ];

        melody.forEach(note => {
            setTimeout(() => {
                this.createTone(note.freq, 0.2, 'triangle');
            }, note.time);
        });

        // Aplausos sintéticos
        setTimeout(() => {
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    this.createTone(100 + Math.random() * 100, 0.05, 'square');
                }, i * 80);
            }
        }, 1000);
    }

    // Derrota
    playDefeat() {
        const descent = [
            { freq: 523.25, time: 0 },   // C5
            { freq: 392.00, time: 200 }, // G4
            { freq: 293.66, time: 400 }, // D4
            { freq: 196.00, time: 600 }  // G3
        ];

        descent.forEach(note => {
            setTimeout(() => {
                this.createTone(note.freq, 0.3, 'sawtooth');
            }, note.time);
        });
    }

    // Sonido de cinta transportadora
    playConveyor() {
        if (!this.audioContext) return;

        const noise = this.audioContext.createBufferSource();
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.5, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.1;
        }
        
        noise.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 200;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.sfxVolume * 0.2;
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        noise.start();
        noise.stop(this.audioContext.currentTime + 0.5);
    }

    // Electricidad/circuito conectado
    playElectric() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        
        const now = this.audioContext.currentTime;
        oscillator.frequency.setValueAtTime(50, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        
        gainNode.gain.setValueAtTime(this.sfxVolume * 0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        oscillator.start(now);
        oscillator.stop(now + 0.2);
    }

    // Llenar tanque (sonido de líquido)
    playFill() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playBubble();
            }, i * 100);
        }
    }

    // Alarma de peligro
    playAlarm() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createTone(880, 0.2, 'square');
                setTimeout(() => this.createTone(440, 0.2, 'square'), 250);
            }, i * 500);
        }
    }

    // Música ambiental de fábrica (loop)
    startAmbient() {
        if (!this.audioContext || this.ambientLoop) return;

        const playAmbientLoop = () => {
            // Bajo industrial
            this.createTone(65.41, 2, 'sine'); // C2
            setTimeout(() => this.createTone(82.41, 2, 'sine'), 2000); // E2
            
            // Acordes de fondo
            setTimeout(() => {
                this.createTone(130.81, 1.5, 'triangle'); // C3
                this.createTone(164.81, 1.5, 'triangle'); // E3
            }, 500);
            
            setTimeout(() => {
                this.createTone(146.83, 1.5, 'triangle'); // D3
                this.createTone(196.00, 1.5, 'triangle'); // G3
            }, 2500);
        };

        playAmbientLoop();
        this.ambientLoop = setInterval(playAmbientLoop, 4000);
    }

    stopAmbient() {
        if (this.ambientLoop) {
            clearInterval(this.ambientLoop);
            this.ambientLoop = null;
        }
    }

    // Sonido al pasar de nivel
    playLevelUp() {
        const arpeggio = [
            { freq: 261.63, time: 0 },
            { freq: 329.63, time: 100 },
            { freq: 392.00, time: 200 },
            { freq: 523.25, time: 300 },
            { freq: 659.25, time: 400 },
            { freq: 783.99, time: 500 }
        ];

        arpeggio.forEach(note => {
            setTimeout(() => {
                this.createTone(note.freq, 0.15, 'sine');
            }, note.time);
        });
    }

    // Efecto de partículas cayendo
    playParticleDrop() {
        const freq = 200 + Math.random() * 100;
        this.createTone(freq, 0.05, 'sine');
    }

    // Sonido al hacer drag (arrastre)
    playDrag() {
        this.createTone(300, 0.1, 'triangle');
    }

    // Sonido al soltar (drop)
    playDrop() {
        this.createTone(250, 0.15, 'sine');
        setTimeout(() => this.createTone(200, 0.1, 'sine'), 80);
    }

    // Ajustar volúmenes
    setMusicVolume(vol) {
        this.musicVolume = Math.max(0, Math.min(1, vol));
    }

    setSFXVolume(vol) {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
    }
}

// Instancia global
const soundManager = new SoundManager();

// Auto-inicializar al primer clic del usuario
document.addEventListener('click', () => {
    soundManager.init();
}, { once: true });

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = soundManager;
}
