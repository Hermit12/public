// material_data.js

function getYieldStrength(quality) {
    const fyb = {
        '4.6': 240,
        '5.6': 300,
        '8.8': 640,
        '10.9': 900
    };
    return fyb[quality] || 240;
}

function getUltimateStrength(quality) {
    const fub = {
        '4.6': 400,
        '5.6': 500,
        '8.8': 800,
        '10.9': 1000
    };
    return fub[quality] || 400;
}

function getNominalCrossSectionArea(thread) {
    const As = {
        'M8': 36.6,
        'M10': 58.0,
        'M12': 84.3,
        'M16': 157,
        'M20': 245
    };
    return As[thread] || 36.6;
}

function getNominalDiameter(thread) {
    const d = {
        'M8': 8,
        'M10': 10,
        'M12': 12,
        'M16': 16,
        'M20': 20
    };
    return d[thread] || 8;
}
