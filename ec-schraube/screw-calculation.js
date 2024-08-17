// screw_calculation.js

function calculateScrewCapacities(quality, thread, shearPlanes) {
    const fyb = getYieldStrength(quality);
    const fub = getUltimateStrength(quality);
    const As = getNominalCrossSectionArea(thread);

    const shearCapacity = 0.6 * fub * As * shearPlanes / 1000; // in kN
    const tensileCapacity = 0.9 * fub * As / 1000; // in kN

    return { shearCapacity, tensileCapacity };
}

function calculateScrewUtilization(shearForce, tensileForce, shearCapacity, tensileCapacity) {
    const shearUtilization = shearForce / shearCapacity;
    const tensileUtilization = Math.abs(tensileForce) / tensileCapacity;
    const combinedUtilization = shearUtilization + tensileUtilization;

    return { shearUtilization, tensileUtilization, combinedUtilization };
}
