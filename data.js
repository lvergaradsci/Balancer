// data.js - Configuración de niveles y contenido educativo

const GAME_DATA = {
    levels: [
        {
            id: 1,
            title: "MONOPOLIO: La Máquina Desbalanceada",
            description: "Una empresa controla todo el mercado. Balancea precios justos con incentivos.",
            minigameType: "hydraulic", // Hidráulica de fluidos
            difficulty: 1,
            duration: 60, // segundos
            targetWelfare: 70, // porcentaje mínimo
            maxAbuse: 40, // porcentaje máximo permitido
            initialPressure: 30,
            initialJustice: 50,
            messages: {
                intro: "🏭 NIVEL 1: Un monopolio controla el mercado. Ajusta las válvulas de impuestos e incentivos.",
                success: "¡Excelente! Has evitado el abuso monopolístico manteniendo el bienestar social.",
                failure: "El monopolio colapsó el bienestar. Recuerda: equilibrio entre control y libertad."
            },
            supervisorMessages: [
                "Carolina aquí: ¡Gran trabajo regulando ese monopolio! Seguiste nuestra teoría perfectamente.",
                "Mateo reporta: Tus válvulas funcionaron como Swiss clockwork. ¡Sigue así!",
                "Santiago observa: Balance perfecto entre impuestos y libertad. ¡Nivel superado!"
            ],
            controls: {
                taxValve: { min: 0, max: 100, initial: 30, step: 5 },
                incentiveValve: { min: 0, max: 100, initial: 40, step: 5 }
            },
            particles: {
                count: 100,
                speed: 2,
                gravity: 0.5
            }
        },
        {
            id: 2,
            title: "PUBLICIDAD ENGAÑOSA: La Trituradora de Mentiras",
            description: "Empresas usan publicidad falsa. Clasifica productos en la cinta transportadora.",
            minigameType: "conveyor", // Clasificación en cintas
            difficulty: 2,
            duration: 70,
            targetWelfare: 75,
            maxAbuse: 35,
            initialPressure: 45,
            initialJustice: 55,
            messages: {
                intro: "📦 NIVEL 2: La cinta trae productos. Arrastra la publicidad engañosa a SANCIONES.",
                success: "¡Protegiste a los consumidores! La trituradora procesó toda la publicidad falsa.",
                failure: "Dejaste pasar productos engañosos. Los consumidores perdieron confianza."
            },
            supervisorMessages: [
                "Luis verifica: ¡100% de clasificación correcta! Eso es ingeniería de precisión.",
                "Carolina aplaude: Cada producto en su lugar. El mercado está más transparente.",
                "Mateo confirma: La trituradora procesó todas las mentiras. ¡Nivel completado!"
            ],
            conveyorSpeed: 3,
            productsPerMinute: 15,
            productTypes: [
                { type: "good", label: "Producto Básico", destination: "subsidize", color: "#06FFA5" },
                { type: "bad", label: "Publicidad Engañosa", destination: "sanction", color: "#FF6B35" },
                { type: "neutral", label: "Producto Lujo", destination: "tax", color: "#FFE66D" }
            ]
        },
        {
            id: 3,
            title: "PRODUCTOS DAÑINOS: El Filtro Nacional",
            description: "Productos peligrosos ingresan al mercado. Activa el filtro de seguridad.",
            minigameType: "filter",
            difficulty: 2,
            duration: 65,
            targetWelfare: 80,
            maxAbuse: 30,
            initialPressure: 50,
            initialJustice: 60,
            messages: {
                intro: "⚠️ NIVEL 3: Productos tóxicos detectados. Filtra lo dañino antes que llegue al consumidor.",
                success: "¡Seguridad garantizada! El filtro bloqueó todos los productos peligrosos.",
                failure: "Productos dañinos pasaron el filtro. La salud pública está en riesgo."
            },
            supervisorMessages: [
                "Santiago analiza: Sistema de filtrado al 100%. Los ciudadanos están seguros.",
                "Luis reporta: Cero productos tóxicos en circulación. ¡Trabajo impecable!",
                "Carolina felicita: El mercado ahora es un espacio seguro para todos."
            ],
            filterTypes: ["toxic", "safe", "uncertain"],
            filterSpeed: 4
        },
        {
            id: 4,
            title: "DESIGUALDAD ECONÓMICA: El Redistribuidor",
            description: "La riqueza se concentra en pocas manos. Redistribuye recursos equitativamente.",
            minigameType: "hydraulic",
            difficulty: 3,
            duration: 75,
            targetWelfare: 85,
            maxAbuse: 25,
            initialPressure: 60,
            initialJustice: 65,
            messages: {
                intro: "💰 NIVEL 4: La desigualdad aumenta. Ajusta las válvulas para distribuir riqueza.",
                success: "¡Equidad lograda! La distribución de recursos está balanceada.",
                failure: "La desigualdad se disparó. Algunos tienen todo, otros nada."
            },
            supervisorMessages: [
                "Mateo celebra: ¡Gini coefficient optimizado! Distribución perfecta de recursos.",
                "Carolina observa: Cada ciudadano tiene acceso justo. ¡Misión cumplida!",
                "Santiago confirma: El balance social está restaurado. ¡Excelente ingeniería!"
            ],
            controls: {
                taxValve: { min: 0, max: 100, initial: 50, step: 5 },
                incentiveValve: { min: 0, max: 100, initial: 50, step: 5 },
                subsidyValve: { min: 0, max: 100, initial: 30, step: 5 }
            },
            particles: {
                count: 150,
                speed: 2.5,
                gravity: 0.6
            }
        },
        {
            id: 5,
            title: "CIRCUITO DE CRECIMIENTO: El Balanceador Final",
            description: "Conecta los cables correctos para activar el crecimiento económico equilibrado.",
            minigameType: "circuit",
            difficulty: 3,
            duration: 80,
            targetWelfare: 90,
            maxAbuse: 20,
            initialPressure: 70,
            initialJustice: 70,
            messages: {
                intro: "⚡ NIVEL 5: Conecta los circuitos. Mucho control = cables rotos. Balance = luz verde.",
                success: "¡Circuito perfecto! Crecimiento económico con justicia social activado.",
                failure: "Cortocircuito detectado. El sistema se sobrecargó por desbalance."
            },
            supervisorMessages: [
                "Luis aplaude de pie: ¡INGENIERO MAESTRO! Todos los circuitos en armonía.",
                "El equipo completo felicita: Carolina, Mateo, Santiago y Luis están orgullosos de ti.",
                "Carolina proclama: ¡Has dominado la regulación de mercado! Eres un Ingeniero Elite."
            ],
            circuits: [
                { from: "taxes", to: "publicServices", resistance: "low" },
                { from: "incentives", to: "innovation", resistance: "medium" },
                { from: "regulation", to: "fairCompetition", resistance: "balanced" }
            ],
            requiredConnections: 3
        },
        {
            id: 6,
            title: "INFLACIÓN: La Bestia de Mil Cabezas",
            description: "Los precios se disparan descontroladamente. Estabiliza la economía.",
            minigameType: "hydraulic",
            difficulty: 4,
            duration: 90,
            targetWelfare: 85,
            maxAbuse: 25,
            initialPressure: 85,
            initialJustice: 60,
            messages: {
                intro: "📈 NIVEL FINAL: ¡INFLACIÓN EXTREMA! Controla las válvulas antes del colapso total.",
                success: "¡VICTORIA TOTAL! Has salvado la economía nacional del colapso inflacionario.",
                failure: "La inflación destruyó el poder adquisitivo. El caos económico es inevitable."
            },
            supervisorMessages: [
                "¡LEYENDA! El equipo completo te reconoce como INGENIERO JEFE SUPREMO.",
                "Has demostrado maestría absoluta en regulación de mercado. ¡Felicitaciones!",
                "Tu nombre será grabado en la historia de la Fábrica de Bienestar. ¡HÉROE NACIONAL!"
            ],
            controls: {
                taxValve: { min: 0, max: 100, initial: 60, step: 3 },
                incentiveValve: { min: 0, max: 100, initial: 40, step: 3 },
                subsidyValve: { min: 0, max: 100, initial: 50, step: 3 },
                interestRate: { min: 0, max: 100, initial: 30, step: 2 }
            },
            particles: {
                count: 200,
                speed: 3.5,
                gravity: 0.7,
                turbulence: true
            }
        }
    ],

    // Configuración de combo y puntuación
    scoring: {
        basePoints: 100,
        comboMultipliers: [1, 1.5, 2, 2.5, 3, 4, 5],
        comboDecayTime: 3000, // ms sin acción para resetear combo
        bonusWelfare: 10, // puntos por cada % de welfare arriba del mínimo
        penaltyAbuse: 15, // puntos menos por cada % de abuse arriba del máximo
        perfectBonus: 500, // bonus por nivel perfecto
        speedBonus: {
            fast: 300, // terminar en menos de 50% del tiempo
            medium: 150, // terminar en menos de 75% del tiempo
            slow: 0
        }
    },

    // Mensajes de supervisores rotativos
    supervisors: [
        { name: "Carolina Arrieta", avatar: "👩‍💼", specialty: "Equidad Social" },
        { name: "Mateo Jiménez", avatar: "👨‍🔬", specialty: "Análisis de Mercado" },
        { name: "Santiago Ávila", avatar: "👨‍💼", specialty: "Regulación Técnica" },
        { name: "Luis Vergara", avatar: "👨‍🏫", specialty: "Política Económica" }
    ],

    // Teoría educativa (para modal de ayuda)
    theory: {
        mission: "Regular el espacio donde productores y consumidores intercambian bienes y servicios.",
        risks: [
            "Desigualdad económica que concentra riqueza",
            "Productos innecesarios o dañinos para consumidores",
            "Abusos de poder por parte de grandes empresas"
        ],
        actions: [
            "Sancionar prácticas comerciales deshonestas",
            "Prohibir productos que dañan la salud pública",
            "Ofrecer incentivos para comportamiento ético",
            "Regular precios para evitar monopolios",
            "Redistribuir recursos para equilibrio social"
        ],
        authors: "Carolina Arrieta, Mateo Jiménez, Santiago Ávila, Luis Vergara"
    }
};

// Configuración de partículas para física de fluidos
const PARTICLE_CONFIG = {
    colors: {
        welfare: '#06FFA5',
        abuse: '#FF6B35',
        neutral: '#4ECDC4'
    },
    sizes: {
        min: 3,
        max: 8
    },
    bounce: 0.6,
    friction: 0.98
};

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GAME_DATA, PARTICLE_CONFIG };
}
