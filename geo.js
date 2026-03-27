/**
 * geo.js - Módulo centralizado de geodesia para Visor Forestal ACOPAC
 *
 * Convenciones:
 *   - Todos los ángulos internos en RADIANES; conversión a grados solo para UI.
 *   - Bearings: 0° = Norte, sentido horario, rango [0, 360).
 *   - Coordenadas: { lat, lon } en grados decimales WGS84.
 *   - Radio terrestre: WGS84 esfera media R = 6 371 000 m.
 *
 * Limitaciones documentadas:
 *   - Modelo esférico (no elipsoidal): error máximo ~0.3 % en distancia.
 *   - Para distancias parcelarias (< 10 km) el error es centimétrico/decimétrico.
 *   - NO sustituye levantamientos IGN/CORS ni topografía legal.
 *   - En terrenos muy accidentados la distancia real sobre superficie puede
 *     diferir significativamente de la distancia geodésica horizontal.
 */

// Radio medio WGS84 en metros
const GEO_R = 6371000;

// ── Conversión grados ↔ radianes ──────────────────────────────────────

function toRad(deg) {
    return deg * Math.PI / 180;
}

function toDeg(rad) {
    return rad * 180 / Math.PI;
}

// ── Normalización de ángulos ──────────────────────────────────────────

/**
 * Normaliza un bearing al rango [0, 360).
 * Convención: 0° = Norte, sentido horario.
 * @param {number} bearing - Ángulo en grados (puede ser negativo o > 360).
 * @returns {number} Bearing normalizado [0, 360).
 */
function normalizeBearing(bearing) {
    return ((bearing % 360) + 360) % 360;
}

/**
 * Normaliza un ángulo al rango [-180, 180) para rotaciones mínimas.
 * @param {number} angle - Ángulo en grados.
 * @returns {number} Ángulo normalizado [-180, 180).
 */
function normalizeAngle(angle) {
    let a = ((angle % 360) + 360) % 360;
    if (a > 180) a -= 360;
    return a;
}

// ── Distancia Haversine ───────────────────────────────────────────────

/**
 * Calcula distancia entre dos puntos usando fórmula Haversine.
 * @param {{ lat: number, lon: number }} p1 - Punto origen (grados).
 * @param {{ lat: number, lon: number }} p2 - Punto destino (grados).
 * @returns {number} Distancia en metros.
 */
function distanceHaversine(p1, p2) {
    const φ1 = toRad(p1.lat);
    const φ2 = toRad(p2.lat);
    const Δφ = toRad(p2.lat - p1.lat);
    const Δλ = toRad(p2.lon - p1.lon);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return GEO_R * c;
}

// ── Bearing (rumbo) ───────────────────────────────────────────────────

/**
 * Calcula el bearing inicial desde p1 hacia p2.
 * @param {{ lat: number, lon: number }} p1 - Punto origen (grados).
 * @param {{ lat: number, lon: number }} p2 - Punto destino (grados).
 * @returns {number} Bearing en grados [0, 360), 0° = Norte, sentido horario.
 */
function bearing(p1, p2) {
    const φ1 = toRad(p1.lat);
    const φ2 = toRad(p2.lat);
    const Δλ = toRad(p2.lon - p1.lon);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    return normalizeBearing(toDeg(Math.atan2(y, x)));
}

// ── Punto destino ─────────────────────────────────────────────────────

/**
 * Calcula el punto destino dados un origen, bearing y distancia.
 * @param {{ lat: number, lon: number }} p - Punto origen (grados).
 * @param {number} brng - Bearing en grados.
 * @param {number} dist - Distancia en metros.
 * @returns {{ lat: number, lon: number }} Punto destino (grados).
 */
function destination(p, brng, dist) {
    const φ1 = toRad(p.lat);
    const λ1 = toRad(p.lon);
    const θ = toRad(brng);
    const δ = dist / GEO_R;

    const φ2 = Math.asin(
        Math.sin(φ1) * Math.cos(δ) +
        Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
    );
    const λ2 = λ1 + Math.atan2(
        Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
        Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );

    return {
        lat: toDeg(φ2),
        lon: toDeg(λ2)
    };
}

// ── Filtro de suavizado para heading ──────────────────────────────────

/**
 * Filtro exponencial de paso bajo para ángulos circulares.
 * Evita saltos bruscos al cruzar 0°/360°.
 * @param {number} newVal - Nuevo valor en grados.
 * @param {number} oldVal - Valor anterior filtrado en grados.
 * @param {number} alpha - Factor de suavizado (0–1; menor = más suave).
 * @returns {number} Valor filtrado [0, 360).
 */
function lowPassHeading(newVal, oldVal, alpha) {
    let diff = newVal - oldVal;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return normalizeBearing(oldVal + alpha * diff);
}

/**
 * Promedio circular de un arreglo de ángulos en grados.
 * @param {number[]} angles - Arreglo de ángulos en grados.
 * @returns {number} Promedio circular [0, 360).
 */
function circularMeanDeg(angles) {
    if (!angles || angles.length === 0) return 0;
    let sinSum = 0, cosSum = 0;
    for (const a of angles) {
        const r = toRad(a);
        sinSum += Math.sin(r);
        cosSum += Math.cos(r);
    }
    return normalizeBearing(toDeg(Math.atan2(sinSum / angles.length, cosSum / angles.length)));
}

// ── Validación de coordenadas ─────────────────────────────────────────

/**
 * Verifica si unas coordenadas WGS84 están dentro del dominio de Costa Rica.
 * Bounding box aproximado: lat [7.0, 11.5], lon [-86.5, -82.0].
 * @param {number} lat - Latitud en grados.
 * @param {number} lon - Longitud en grados.
 * @returns {{ valid: boolean, message: string }}
 */
function validateCoordsCR(lat, lon) {
    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
        return { valid: false, message: 'Coordenadas inválidas (no son números).' };
    }
    if (lat < -90 || lat > 90) {
        return { valid: false, message: 'Latitud fuera de rango (-90 a 90).' };
    }
    if (lon < -180 || lon > 180) {
        return { valid: false, message: 'Longitud fuera de rango (-180 a 180).' };
    }
    if (lat < 7.0 || lat > 11.5 || lon < -86.5 || lon > -82.0) {
        return { valid: false, message: 'Coordenadas fuera de Costa Rica.' };
    }
    return { valid: true, message: 'OK' };
}

/**
 * Valida formato CRTM05 (Costa Rica TM 2005).
 * Rangos esperados: X (Este) ~350 000 – 700 000, Y (Norte) ~850 000 – 1 250 000.
 * @param {number} x - Coordenada Este.
 * @param {number} y - Coordenada Norte.
 * @returns {{ valid: boolean, message: string }}
 */
function validateCRTM05(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
        return { valid: false, message: 'Coordenadas CRTM05 inválidas.' };
    }
    if (x < 350000 || x > 700000) {
        return { valid: false, message: 'Coordenada Este (X) fuera de rango CRTM05 (350000–700000).' };
    }
    if (y < 850000 || y > 1250000) {
        return { valid: false, message: 'Coordenada Norte (Y) fuera de rango CRTM05 (850000–1250000).' };
    }
    return { valid: true, message: 'OK' };
}

// ── Formateo para UI ──────────────────────────────────────────────────

/**
 * Formatea distancia: metros si < 1000, kilómetros si >= 1000.
 * @param {number} meters - Distancia en metros.
 * @returns {string}
 */
function formatDistanceGeo(meters) {
    if (meters < 1000) return Math.round(meters) + ' m';
    return (meters / 1000).toFixed(2) + ' km';
}

/**
 * Formatea bearing a string con 1 decimal.
 * @param {number} brng - Bearing en grados.
 * @returns {string} Ej: "45.2°"
 */
function formatBearing(brng) {
    return normalizeBearing(brng).toFixed(1) + '°';
}

// ── Modo caminar / vehículo ───────────────────────────────────────────

/**
 * Determina la fuente de heading preferida según la velocidad.
 * < 1.5 m/s → brújula/sensor de orientación (más fiable a baja velocidad).
 * >= 1.5 m/s → heading GPS (magnetómetro se contamina con vibración vehicular).
 * @param {number|null} speed - Velocidad GPS en m/s (puede ser null).
 * @param {number} sensorHeading - Heading del sensor de orientación (grados).
 * @param {number|null} gpsHeading - Heading del GPS (grados, puede ser null).
 * @returns {{ heading: number, source: string }}
 */
function selectHeadingSource(speed, sensorHeading, gpsHeading) {
    const SPEED_THRESHOLD = 1.5; // m/s (~5.4 km/h)

    if (speed !== null && speed >= SPEED_THRESHOLD && gpsHeading !== null && !isNaN(gpsHeading)) {
        return { heading: normalizeBearing(gpsHeading), source: 'gps' };
    }
    return { heading: normalizeBearing(sensorHeading), source: 'sensor' };
}

// ── Logger de campo ───────────────────────────────────────────────────

/**
 * Crea un registro de campo con datos de depuración.
 * @param {object} data
 * @returns {object} Registro con timestamp ISO.
 */
function createFieldLogEntry(data) {
    return {
        timestamp: new Date().toISOString(),
        lat: data.lat ?? null,
        lon: data.lon ?? null,
        accuracy: data.accuracy ?? null,
        altitude: data.altitude ?? null,
        speed: data.speed ?? null,
        gpsHeading: data.gpsHeading ?? null,
        sensorHeading: data.sensorHeading ?? null,
        headingSource: data.headingSource ?? null,
        bearingToDest: data.bearingToDest ?? null,
        distToDest: data.distToDest ?? null,
        gpsQuality: data.gpsQuality ?? null,
        confidence: data.confidence ?? null,
        sensorsActive: data.sensorsActive ?? null
    };
}
