const canvas = document.getElementById('trackCanvas');
const ctx = canvas.getContext('2d');

let raceData = [];
let earliestTime, latestTime;
let minX, maxX, minY, maxY;
let scale = 1;
let offsetX = 0, offsetY = 0;

// 1. Fetch data from your Django Backend
async function fetchRaceData() {
    try {
        const response = await fetch('api/locations/9094/14/');
        const data = await response.json();
        
        // Filter out bad GPS points (null or exactly 0) so we don't get crazy straight lines
        raceData = data.drivers;
        
        minX=data.bounds.minX
        maxX=data.bounds.maxX
        minY=data.bounds.minY
        maxY=data.bounds.maxY

        earliestTime=data.time.start;
        latestTime=data.time.end;
    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Make sure you ran the Python fetch script first!");
    }
}

// 2. Calculate the boundaries so the track fits the canvas
function calculateScale() {

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
    const track_path = new Path2D();
    const outlineDriver = driversData['14'] || Object.values(driversData)[0];
    let currentIndex = 0;
    
    outlineDriver.forEach((point, index) => {
        // Now using point[0] for X and point[1] for Y
        const coords = getCanvasCoords(point[0], point[1]);
        if (index === 0) trackPath.moveTo(coords.x, coords.y);
        else trackPath.lineTo(coords.x, coords.y);
    });

    let currentTime = earliestTime; 
    let playbackSpeed = 20; 
    let lastFrameTime = performance.now();
    
    let pointers = {};
    for (let driver in driversData) { pointers[driver] = 0; }

    function render(now) {
        if (currentTime > latestTime) {
            document.getElementById('startRace').innerText = "Race Finished";
            return;
        }

        let deltaTime = now - lastFrameTime;
        lastFrameTime = now;
        currentTime += deltaTime * playbackSpeed;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.stroke(trackPath);

        for (let driver in driversData) {
            let pts = driversData[driver];
            let p = pointers[driver];

            // Advance pointer. pts[p+1][2] is the timestamp in milliseconds!
            while (p < pts.length - 1 && pts[p+1][2] <= currentTime) {
                p++;
            }
            pointers[driver] = p; 

            let currentPoint = pts[p];
            if (currentPoint) {
                const coords = getCanvasCoords(currentPoint[0], currentPoint[1]);
                
                ctx.fillStyle = '#00ff00'; 
                ctx.beginPath();
                ctx.arc(coords.x, coords.y, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "white";
                ctx.font = "12px Arial";
                ctx.fillText(driver, coords.x + 6, coords.y - 6);
            }
        }

        requestAnimationFrame(render); 
    }
    requestAnimationFrame(render);
}

// 5. Hook it all up to the button
document.getElementById('startRace').addEventListener('click', async () => {
    const btn = document.getElementById('startRace');
    btn.disabled = true;
    btn.innerText = "Loading data...";
    
    await fetchRaceData();
    calculateScale();
    
    btn.innerText = 'Race in Progress (${Object.keys(raceData).length} Drivers)';
    simulateRace();
});