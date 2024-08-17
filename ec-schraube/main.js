// main.js

function updateHoleDiameter() {
    const thread = document.getElementById('thread').value;
    const nominalDiameter = getNominalDiameter(thread);
    const holeDiameter = nominalDiameter + 1; // Standard-Lochspiel von 1mm
    document.getElementById('holeDiameterInfo').innerHTML = `
        <p>Nominaler Schraubendurchmesser: ${nominalDiameter} mm</p>
        <p>Empfohlener Bohrungsdurchmesser: ${holeDiameter} mm</p>
        <p>Lochspiel: 1 mm</p>
    `;
}

function toggleEdgeDistanceInfo() {
    const info = document.getElementById('edgeDistanceInfo');
    info.style.display = info.style.display === 'none' ? 'block' : 'none';
}

function calculate() {
    const quality = document.getElementById('quality').value;
    const thread = document.getElementById('thread').value;
    const tensileForce = parseFloat(document.getElementById('tensileForce').value) || 0;
    const shearForceX = parseFloat(document.getElementById('shearForceX').value) || 0;
    const shearForceY = parseFloat(document.getElementById('shearForceY').value) || 0;
    const shearPlanes = parseInt(document.getElementById('shearPlanes').value) || 1;
    const edgeDistance = parseFloat(document.getElementById('edgeDistance').value) || 0;
    const plateThickness = parseFloat(document.getElementById('plateThickness').value) || 0;

    const totalShearForce = Math.sqrt(shearForceX**2 + shearForceY**2);

    const { shearCapacity, tensileCapacity } = calculateScrewCapacities(quality, thread, shearPlanes);
    const bearingCapacity = calculateBearingCapacity(thread, edgeDistance, plateThickness, getUltimateStrength(quality));

    const { shearUtilization, tensileUtilization, combinedUtilization } = calculateScrewUtilization(totalShearForce, tensileForce, shearCapacity, tensileCapacity);
    const bearingUtilization = calculateBearingUtilization(totalShearForce, bearingCapacity);

    let result = `
        <h2>Ergebnisse:</h2>
        <p>Zug-/Druckkraft: ${tensileForce.toFixed(2)} kN</p>
        <p>Gesamte Querkraft: ${totalShearForce.toFixed(2)} kN</p>
        <p>Scherkapazität: ${shearCapacity.toFixed(2)} kN</p>
        <p>Zugkapazität: ${tensileCapacity.toFixed(2)} kN</p>
        <p>Lochleibungskapazität: ${bearingCapacity.toFixed(2)} kN</p>
        <p>Scherauslastung: ${(shearUtilization * 100).toFixed(2)}%</p>
        <p>Zugauslastung: ${(tensileUtilization * 100).toFixed(2)}%</p>
        <p>Lochleibungsauslastung: ${(bearingUtilization * 100).toFixed(2)}%</p>
        <p>Kombinierte Auslastung (Zug + Abscheren): ${(combinedUtilization * 100).toFixed(2)}%</p>
    `;

    if (combinedUtilization <= 1 && bearingUtilization <= 1) {
        result += "<p style='color: green;'>Die Schraube hält den Belastungen stand.</p>";
    } else {
        result += "<p style='color: red;'>Die Schraube ist überlastet!</p>";
    }

    document.getElementById('result').innerHTML = result;
}

// Event Listeners
document.getElementById('thread').addEventListener('change', updateHoleDiameter);
document.addEventListener('DOMContentLoaded', updateHoleDiameter);
