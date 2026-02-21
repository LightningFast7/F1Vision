const canvas = document.getElementById('trackCanvas');
const ctx = canvas.getContext('2d');
let raceData = [];

// 1. Fetch the data from your Django backend
async function fetchRaceData() {
    // Example: 2023 Monaco GP (9078), Fernando Alonso (14)
    const response = await fetch('/api/locations/9078/14/');
    const data = await response.json();
    raceData = data.locations;
}

// Variables to hold our scaling math
let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;
let scale = 1;
let offsetX = 0, offsetY = 0;

// Call this function AFTER you fetch the raceData
function calculateScale() {
    if (raceData.length === 0) return;

    // 1. Find the bounding box of the track
    raceData.forEach(point => {
        if (point.x < minX) minX = point.x;
        if (point.x > maxX) maxX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.y > maxY) maxY = point.y;
    });

    const trackWidth = maxX - minX;
    const trackHeight = maxY - minY;

    // 2. Calculate the scale factor (with a 10% padding so it doesn't touch the edges)
    const padding = 0.9; 
    const scaleX = canvas.width / trackWidth;
    const scaleY = canvas.height / trackHeight;
    
    // Use the smaller scale to maintain the track's true aspect ratio
    scale = Math.min(scaleX, scaleY) * padding;

    // 3. Calculate offsets to perfectly center the track on the canvas
    offsetX = (canvas.width - (trackWidth * scale)) / 2;
    offsetY = (canvas.height - (trackHeight * scale)) / 2;
}

// 4. The magic function that converts OpenF1 raw data to Canvas pixels
function getCanvasCoords(rawX, rawY) {
    const canvasX = ((rawX - minX) * scale) + offsetX;
    
    // Notice the inverted math here for the Y-axis!
    const canvasY = ((maxY - rawY) * scale) + offsetY; 
    
    return { x: canvasX, y: canvasY };
}

// 2. The Simulation Loop
async function simulateRace() {
    if (raceData.length === 0) return;

    let currentIndex = 0;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ... inside your simulateRace() function ...

    function drawNextFrame() {
        if (currentIndex >= raceData.length - 1) return;

        const currentPoint = raceData[currentIndex];
        const nextPoint = raceData[currentIndex + 1];

        // Get the scaled, perfectly positioned coordinates!
        const screenCoords = getCanvasCoords(currentPoint.x, currentPoint.y);

        // Draw the car
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(screenCoords.x, screenCoords.y, 4, 0, Math.PI * 2); // Draw a circle instead of a square
        ctx.fill();

        // Calculate time diff and trigger next frame
        const timeDiff = new Date(nextPoint.date).getTime() - new Date(currentPoint.date).getTime();
        currentIndex++;
        setTimeout(drawNextFrame, timeDiff);
    }

    drawNextFrame(); // Start the loop
}

document.getElementById('startRace').addEventListener('click', async () => {
    await fetchRaceData();
    calculateScale();
    simulateRace();
});