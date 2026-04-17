// sheets.js - Conexión con Google Sheets (Leaderboard)

// IMPORTANTE: Reemplaza esta URL con tu propio Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxr2VC6mI9DbabxIu6jUmJiYmd12i2yJfI__hVuWaGVrVFMKKPzA-rPE5ASAx_v7i1z0A/exec';

// Flag para desarrollo (usar localStorage si no hay API)
const USE_LOCAL_STORAGE = false; // Cambiar a false cuando tengas la URL real

class LeaderboardManager {
    constructor() {
        this.localStorageKey = 'industrial_balancer_scores';
        this.cache = null;
        this.lastFetch = null;
        this.cacheDuration = 60000; // 1 minuto
    }

    // Guardar puntuación (asíncrono, no bloquea el juego)
    async saveScore(playerName, score, level) {
        console.log(`💾 Guardando puntuación: ${playerName} - ${score} pts - Nivel ${level}`);

        const scoreData = {
            name: playerName,
            score: score,
            level: level,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('es-CO')
        };

        // Guardar localmente primero (respaldo)
        this.saveLocalScore(scoreData);

        // Intentar enviar a Google Sheets en segundo plano
        if (!USE_LOCAL_STORAGE && GOOGLE_SCRIPT_URL !== 'TU_GOOGLE_APPS_SCRIPT_URL_AQUI') {
            try {
                await this.sendToGoogleSheets(scoreData);
                console.log('✅ Puntuación enviada a Google Sheets');
            } catch (error) {
                console.warn('⚠️ Error enviando a Sheets, usando almacenamiento local:', error);
            }
        } else {
            console.log('📱 Usando almacenamiento local (modo desarrollo)');
        }

        // Invalidar caché
        this.cache = null;
    }

    // Enviar a Google Sheets
    async sendToGoogleSheets(scoreData) {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Evita problemas de CORS
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scoreData)
        });

        // Con no-cors no podemos leer la respuesta, pero el request se envía
        return true;
    }

    // Guardar en localStorage (respaldo)
    saveLocalScore(scoreData) {
        try {
            const scores = this.getLocalScores();
            scores.push(scoreData);
            
            // Ordenar por puntuación (mayor a menor)
            scores.sort((a, b) => b.score - a.score);
            
            // Mantener solo top 50
            const topScores = scores.slice(0, 50);
            
            localStorage.setItem(this.localStorageKey, JSON.stringify(topScores));
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
        }
    }

    // Obtener puntuaciones locales
    getLocalScores() {
        try {
            const data = localStorage.getItem(this.localStorageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error leyendo localStorage:', error);
            return [];
        }
    }

    // Obtener leaderboard (con caché)
    async getLeaderboard(forceRefresh = false) {
        // Usar caché si está disponible y es reciente
        if (!forceRefresh && this.cache && this.lastFetch) {
            const elapsed = Date.now() - this.lastFetch;
            if (elapsed < this.cacheDuration) {
                console.log('📊 Usando leaderboard cacheado');
                return this.cache;
            }
        }

        console.log('🔄 Obteniendo leaderboard...');

        // Intentar obtener de Google Sheets
        if (!USE_LOCAL_STORAGE && GOOGLE_SCRIPT_URL !== 'TU_GOOGLE_APPS_SCRIPT_URL_AQUI') {
            try {
                const scores = await this.fetchFromGoogleSheets();
                this.cache = scores;
                this.lastFetch = Date.now();
                return scores;
            } catch (error) {
                console.warn('⚠️ Error obteniendo de Sheets, usando datos locales:', error);
            }
        }

        // Fallback: usar localStorage
        const localScores = this.getLocalScores();
        this.cache = localScores;
        this.lastFetch = Date.now();
        return localScores;
    }

    // Obtener de Google Sheets
    async fetchFromGoogleSheets() {
        try {
            const response = await fetch(GOOGLE_SCRIPT_URL + '?action=get', {
                method: 'GET'
            });

            if (!response.ok) throw new Error('Error en la respuesta');

            const data = await response.json();
            return data.scores || [];
        } catch (error) {
            throw error;
        }
    }

    // Formatear leaderboard para visualización
    formatLeaderboard(scores, maxEntries = 10) {
        return scores.slice(0, maxEntries).map((entry, index) => ({
            rank: index + 1,
            name: entry.name,
            score: entry.score,
            level: entry.level,
            date: entry.date,
            medal: this.getMedal(index)
        }));
    }

    // Obtener medalla según posición
    getMedal(index) {
        switch(index) {
            case 0: return '🥇';
            case 1: return '🥈';
            case 2: return '🥉';
            default: return `${index + 1}°`;
        }
    }

    // Verificar si es top 10
    async isTopTen(score) {
        const leaderboard = await this.getLeaderboard();
        if (leaderboard.length < 10) return true;
        return score > leaderboard[9].score;
    }

    // Obtener ranking del jugador
    async getPlayerRank(playerName) {
        const leaderboard = await this.getLeaderboard();
        const index = leaderboard.findIndex(entry => entry.name === playerName);
        return index >= 0 ? index + 1 : null;
    }

    // Limpiar caché
    clearCache() {
        this.cache = null;
        this.lastFetch = null;
    }

    // Reiniciar leaderboard local (solo desarrollo)
    resetLocalLeaderboard() {
        if (confirm('¿Seguro que quieres reiniciar el ranking local?')) {
            localStorage.removeItem(this.localStorageKey);
            this.cache = null;
            console.log('🗑️ Leaderboard local reiniciado');
            return true;
        }
        return false;
    }
}

// Instancia global
const leaderboardManager = new LeaderboardManager();

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = leaderboardManager;
}
