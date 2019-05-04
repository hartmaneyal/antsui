const electron = require('electron');
const { remote, ipcRenderer : ipc } = electron;

let antArray;
const cWidth = 400;
const cHeight = 400;
const xL = 4;
const yL = 4;

function drawGridLines(ctx, canvasWidth, canvasHeight, xStep, yStep){    
    ctx.beginPath(); 
    for (var x = 0; x <= canvasWidth; x += xStep) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasHeight);
    }

    for (var y = 0; y <= canvasHeight; y += yStep) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
    }
    ctx.strokeStyle = 'grey';
    ctx.lineWidth = 1;
    ctx.stroke(); 
};

function initGrid(canvasWidth, canvasHeight){
    var canvas = document.getElementById('grid');
    canvas.innerHTML = "";
    var ctx = canvas.getContext('2d');

    canvas.width  = canvasWidth;
    canvas.height = canvasHeight;

    return ctx;
}

function drawEmptyGrid(canvasWidth, canvasHeight, xLines, yLines){
    var ctx = initGrid(canvasWidth, canvasHeight);

    const xStep = canvasWidth / xLines;
    const yStep = canvasHeight / yLines;

    drawGridLines(ctx, canvasWidth, canvasHeight, xStep, yStep);
};

function drawFullGrid(canvasWidth, canvasHeight, xLines, yLines){
    var ctx = initGrid(canvasWidth, canvasHeight);

    const xStep = canvasWidth / xLines;
    const yStep = canvasHeight / yLines;

    drawGridLines(ctx, canvasWidth, canvasHeight, xStep, yStep);

    ctx.beginPath();
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 3;
    ctx.moveTo(xStep, canvasHeight);
    ctx.lineTo(xStep*2, canvasHeight);
    ctx.stroke(); 
};

function initAnt(antId){
    const ants = document.getElementById('ants');
    const img = new Image();
    img.id = 'ant' + antId;
    img.classList.add('ant');
    img.src = '../../images/ant.png';
    ants.appendChild(img);
};

window.addEventListener('DOMContentLoaded', _ => {
    const drawGrid = document.getElementById('drawGrid');
    drawGrid.addEventListener('click', (evt) => {
        drawFullGrid(cWidth, cHeight, xL, yL);
    });

    const simulateAnts = document.getElementById('simulateAnts');
    simulateAnts.addEventListener('click', (evt) => {
        drawEmptyGrid(cWidth, cHeight, xL, yL);
        const ants = document.getElementById('ants');
        ants.innerHTML = "";
        antArray = [];
        ipc.send('move-ant');
    });
});

ipc.on('ant-moved', (evt, telemetry) => {
    if(!antArray.includes(telemetry.id)){
        initAnt(telemetry.id);
        antArray.push(telemetry.id);
        console.log("added ant");
    }
    let ant = document.getElementById(`ant${telemetry.id}`);
    ant.style.left = telemetry.x;
    ant.style.top = telemetry.y;
    ant.style.transform = `rotate(${telemetry.angle}deg)`;
});