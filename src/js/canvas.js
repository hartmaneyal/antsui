const electron = require('electron');
const { remote, ipcRenderer : ipc } = electron;

function drawGrid(ctx, canvasWidth, canvasHeight, xStep, yStep){    
    ctx.beginPath(); 
    for (var x = 0; x <= canvasWidth; x += xStep) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasHeight);
    }

    for (var y = 0; y <= canvasHeight; y += yStep) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
    }
    ctx.strokeStyle = 'rgb(255,0,0)';
    ctx.lineWidth = 1;
    ctx.stroke(); 
};

function draw(canvasWidth, canvasHeight, xLines, yLines){
    var canvas = document.getElementById('grid');
    var ctx = canvas.getContext('2d');

    canvas.width  = canvasWidth;
    canvas.height = canvasHeight;

    const xStep = canvasWidth / xLines;
    const yStep = canvasHeight / yLines;

    drawGrid(ctx, canvasWidth, canvasHeight, xStep, yStep);
};

function initAnt(antId){
    const ants = document.getElementById('ants');
    const img = new Image();
    img.id = 'ant' + antId;
    img.classList.add('ant');
    img.src = '../../images/ant.png';
    ants.appendChild(img);
};

let ant;
window.addEventListener('DOMContentLoaded', _ => {
    const drawGrid = document.getElementById('drawGrid');
    drawGrid.addEventListener('click', (evt) => {
        draw(400, 400, 4, 4);
    });

    const simulateAnts = document.getElementById('simulateAnts');
    simulateAnts.addEventListener('click', (evt) => {
        initAnt(1);
        ipc.send('move-ant');
    });
});

ipc.on('ant-moved', (evt, telemetry) => {
    ant = document.getElementById('ant1');
    ant.style.left = telemetry.x;
    ant.style.top = telemetry.y;
    ant.style.transform = `rotate(${telemetry.angle}deg)`;
});