// bearing_calculation.js

function calculateBearingCapacity(thread, edgeDistance, plateThickness, fub) {
    const d = getNominalDiameter(thread);
    const alpha_b = Math.min(edgeDistance / (3 * d), fub / 430, 1);
    const k1 = Math.min(2.8 * edgeDistance / d - 1.7, 2.5);
    return k1 * alpha_b * fub * d * plateThickness / 1000; // in kN
}

function calculateBearingUtilization(shearForce, bearingCapacity) {
    return shearForce / bearingCapacity;
}
