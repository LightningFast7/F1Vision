const canvas = document.getElementById('trackCanvas');
const ctx = canvas.getContext('2d');

let raceData = [];
let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;
let scale = 1;
let offsetX = 0, offsetY = 0;

// 1. Fetch data from your Django Backend
async function fetchRaceData() {
    try {
        const response = await fetch('api/locations/9094/14/');
        const data = await response.json();
        
        // Filter out bad GPS points (null or exactly 0) so we don't get crazy straight lines
        raceData = data.locations.filter(point => 
            point.x != null && point.y != null && 
            point.x !== 0 && point.y !== 0
        );
        
    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Make sure you ran the Python fetch script first!");
    }
}

// 2. Calculate the boundaries so the track fits the canvas
function calculateScale() {
    if (raceData.length === 0) return;

    raceData.forEach(point => {
        if (point.x < minX) minX = point.x;
        if (point.x > maxX) maxX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.y > maxY) maxY = point.y;
    });

    const trackWidth = maxX - minX;
    const trackHeight = maxY - minY;
    
    const padding = 0.9; 
    const scaleX = canvas.width / trackWidth;
    const scaleY = canvas.height / trackHeight;
    
    scale = Math.min(scaleX, scaleY) * padding;
    
    offsetX = (canvas.width - (trackWidth * scale)) / 2;
    offsetY = (canvas.height - (trackHeight * scale)) / 2;
}

// 3. Convert F1 Coordinates to Canvas Pixels
function getCanvasCoords(rawX, rawY) {
    return {
        x: ((rawX - minX) * scale) + offsetX,
        y: ((maxY - rawY) * scale) + offsetY 
    };
}

// 4. The Animation Loop
function simulateRace() {
    if (raceData.length === 0) return;

    let currentIndex = 0;
    
    // Draw the clean outline of the whole track first
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    raceData.forEach((point, index) => {
        const coords = getCanvasCoords(point.x, point.y);
        if (index === 0) ctx.moveTo(coords.x, coords.y);
        else ctx.lineTo(coords.x, coords.y);
    });
    ctx.stroke();

    // The loop that moves the car
    function drawNextFrame() {
        if (currentIndex >= raceData.length - 1) {
            document.getElementById('startRace').innerText = "Race Finished";
            return; 
        }

        const currentPoint = raceData[currentIndex];
        const nextPoint = raceData[currentIndex + 1];
        const coords = getCanvasCoords(currentPoint.x, currentPoint.y);

        // Clear the canvas before drawing the next dot so it doesn't smear
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Because we cleared the canvas, we have to redraw the track outline underneath the car
        ctx.stroke();

        // Draw the car 
        ctx.fillStyle = '#00ff00'; 
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Calculate time diff
        let timeDiff = new Date(nextPoint.date).getTime() - new Date(currentPoint.date).getTime();
        
        // Fast-forward through garage wait times and pit stops!
        if (timeDiff > 1000 || isNaN(timeDiff)) {
            timeDiff = 20; // Skip the wait and jump to the next point in 20 milliseconds
        }
        
        currentIndex++;
        
        setTimeout(drawNextFrame, timeDiff);
    }

    drawNextFrame(); // Kick off the loop
}

// 5. Hook it all up to the button
document.getElementById('startRace').addEventListener('click', async () => {
    const btn = document.getElementById('startRace');
    btn.disabled = true;
    btn.innerText = "Loading data...";
    
    await fetchRaceData();
    calculateScale();
    
    btn.innerText = "Race in Progress";
    simulateRace();
});