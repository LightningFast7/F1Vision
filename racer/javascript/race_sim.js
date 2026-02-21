const canvas = document.getElementById('trackCanvas');
const ctx = canvas.getContext('2d');

let raceData = [];
let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;
let scale = 1;
let offsetX = 0, offsetY = 0;

// 1. Fetch data from your Django Backend (or local JSON file)
async function fetchRaceData() {
    try {
        console.log("1. Fetching data...");
        // NOTE: If you changed this URL to point directly to a .json file, that is perfectly fine!
        const response = await fetch('/api/locations/9078/14/'); 
        const data = await response.json();
        
        // Handle both Django JSON and Raw OpenF1 JSON
        let rawArray = Array.isArray(data) ? data : data.locations;

        if (!rawArray || rawArray.length === 0) {
            console.error("ERROR: Data array is empty. Check your fetch URL.");
            return;
        }

        // Filter out broken GPS coordinates (null/undefined)
        raceData = rawArray.filter(point => point.x != null && point.y != null);
        console.log(`2. Success! Loaded ${raceData.length} valid location points.`);
        
    } catch (error) {
        console.error("ERROR Fetching data:", error);
        alert("Could not load data. Are you running the Django server?");
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
    
    // Safety check
    if (trackWidth === 0 || trackHeight === 0) {
        console.error("ERROR: Track width/height is 0. Data might be invalid.");
        return;
    }

    const padding = 0.9; 
    const scaleX = canvas.width / trackWidth;
    const scaleY = canvas.height / trackHeight;
    
    scale = Math.min(scaleX, scaleY) * padding;
    offsetX = (canvas.width - (trackWidth * scale)) / 2;
    offsetY = (canvas.height - (trackHeight * scale)) / 2;
    
    console.log(`3. Scaling Complete. Scale factor: ${scale}`);
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
    if (raceData.length === 0) {
        console.log("Cannot start simulation: No data.");
        return;
    }

    let currentIndex = 0;
    console.log("4. Starting Simulation Loop...");

    // (Bonus) Draw a faint outline of the whole track first
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    raceData.forEach((point, index) => {
        const coords = getCanvasCoords(point.x, point.y);
        if (index === 0) ctx.moveTo(coords.x, coords.y);
        else ctx.lineTo(coords.x, coords.y);
    });
    ctx.stroke();

    function drawNextFrame() {
        if (currentIndex >= raceData.length - 1) {
            document.getElementById('startRace').innerText = "Race Finished";
            return; 
        }

        const currentPoint = raceData[currentIndex];
        const nextPoint = raceData[currentIndex + 1];
        const coords = getCanvasCoords(currentPoint.x, currentPoint.y);

        // CLEAR the canvas so the previous dot is removed (leaving just the track outline)
        // If you don't do this, it will draw a solid thick green line instead of a moving dot.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Redraw track outline (since we just cleared the canvas)
        ctx.stroke();

        // Draw the car 
        ctx.fillStyle = '#00ff00'; 
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Calculate time gap
        let timeDiff = new Date(nextPoint.date).getTime() - new Date(currentPoint.date).getTime();
        
        // FIX 3: If the car is parked in the pits for more than 1 second, fast-forward!
        if (timeDiff > 1000 || isNaN(timeDiff)) {
            timeDiff = 50; 
        }

        currentIndex++;
        setTimeout(drawNextFrame, timeDiff);
    }

    drawNextFrame(); 
}

// 5. Hook it all up
document.getElementById('startRace').addEventListener('click', async () => {
    const btn = document.getElementById('startRace');
    btn.disabled = true;
    btn.innerText = "Loading data...";
    
    await fetchRaceData();
    calculateScale();
    
    btn.innerText = "Race in Progress";
    simulateRace();
});