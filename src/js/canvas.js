const electron = require('electron');
const { remote, ipcRenderer : ipc } = electron;

const anime = require('animejs');

let canvas;
let antArray;
const cWidth = 200;
const cHeight = 200;
const xL = 4;
const yL = 4;
const xStep = cWidth / xL;
const yStep = cHeight / yL;
const imgWidth = xStep/2;
const imgHeight = yStep/2;
let gridTop;
let gridLeft;

const gridLineColor = '#5bcb6b';
const specialLineColor = 'green';
const wallLineColor = 'purple';
const exitLineColor = 'red';
const visitedBlock = '#42965a';

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
    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = 1;
    ctx.stroke(); 
};

function initGrid(canvasWidth, canvasHeight){
    canvas = document.getElementById('grid');
    canvas.innerHTML = "";
    var ctx = canvas.getContext('2d');

    canvas.width  = canvasWidth;
    canvas.height = canvasHeight;

    const rect = canvas.getBoundingClientRect();

    gridTop = rect.top;
    gridLeft = rect.left;

    return ctx;
};

function drawSpecialLine(ctx, fromX, toX, fromY, toY, brushColor, brushWidth){
    ctx.beginPath();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke(); 
};

function drawEntrance(ctx, fromX, toX, fromY, toY){
    drawSpecialLine(ctx, fromX, toX, fromY, toY, specialLineColor, 3);
};

function drawWall(ctx, fromX, toX, fromY, toY){
    drawSpecialLine(ctx, fromX, toX, fromY, toY, wallLineColor, 3);
};

function drawOpen(ctx, fromX, toX, fromY, toY){
    drawSpecialLine(ctx, fromX, toX, fromY, toY, gridLineColor, 1);
};

function drawExit(ctx, fromX, toX, fromY, toY){
    drawSpecialLine(ctx, fromX, toX, fromY, toY, exitLineColor, 2);
};

function gridFog(ctx){
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, cWidth, cHeight);
};

function gridBlockOpen(ctx, fromx, fromY, width, height){
    ctx.fillStyle = visitedBlock; //'#3B3B47';
    ctx.fillRect(fromx + 2, fromY + 2, width - 4, height - 4);
};

function drawEmptyGrid(canvasWidth, canvasHeight, xLines, yLines){
    var ctx = initGrid(canvasWidth, canvasHeight);

    drawGridLines(ctx, canvasWidth, canvasHeight, xStep, yStep);
    //gridFog(ctx);
};

function drawFullGrid(canvasWidth, canvasHeight, xLines, yLines){
    var ctx = initGrid(canvasWidth, canvasHeight);

    drawGridLines(ctx, canvasWidth, canvasHeight, xStep, yStep);
    drawEntrance(ctx, xStep, xStep*2, canvasHeight, canvasHeight);
    drawWall(ctx, 0, xStep, canvasHeight, canvasHeight);
    drawWall(ctx, 0, 0, canvasHeight, canvasHeight-yStep);
    drawWall(ctx, 0, xStep, canvasHeight-yStep, canvasHeight-yStep);
    drawWall(ctx, xStep, xStep, canvasHeight-yStep, canvasHeight-yStep*4);
    drawWall(ctx, xStep*2, xStep*3, canvasHeight, canvasHeight);
    drawWall(ctx, xStep*3, xStep*3, canvasHeight, canvasHeight-yStep*3);
    drawWall(ctx, xStep*3, xStep*4, canvasHeight-yStep*3, canvasHeight-yStep*3);
    drawWall(ctx, xStep, xStep*4, canvasHeight-yStep*4, canvasHeight-yStep*4);
    drawExit(ctx, xStep*4, xStep*4, canvasHeight-yStep*3, canvasHeight-yStep*4);
};

function initAnt(antId){
    const ants = document.getElementById('ants');
    const img = new Image();
    img.id = 'ant' + antId;
    img.classList.add('ant');
    img.src = '../../images/drone.png';
    img.width = imgWidth;
    img.height = imgHeight;
    ants.appendChild(img);
};

function updateGrid(ant){
    var ctx = canvas.getContext('2d');
    let leftLine = ant.x-1;
    let bottomLine = yL - ant.y + 1;

    gridBlockOpen(ctx, leftLine*xStep, yStep*(bottomLine-1), xStep, yStep);

    if(ant.ll === 'wall') drawWall(ctx, leftLine*xStep, leftLine*xStep, yStep*bottomLine, yStep*(bottomLine-1));
    if(ant.ll === 'entr') drawEntrance(ctx, leftLine*xStep, leftLine*xStep, yStep*bottomLine, yStep*(bottomLine-1)); 
    if(ant.ll === 'exit') drawExit(ctx, leftLine*xStep, leftLine*xStep, yStep*bottomLine, yStep*(bottomLine-1));
    if(ant.ll === 'open') drawOpen(ctx, leftLine*xStep, leftLine*xStep, yStep*bottomLine, yStep*(bottomLine-1));
    
    if(ant.ul === 'wall') drawWall(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*(bottomLine-1), yStep*(bottomLine-1));
    if(ant.ul === 'entr') drawEntrance(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*(bottomLine-1), yStep*(bottomLine-1));
    if(ant.ul === 'exit') drawExit(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*(bottomLine-1), yStep*(bottomLine-1));
    if(ant.ul === 'open') drawOpen(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*(bottomLine-1), yStep*(bottomLine-1));
    
    if(ant.rl === 'wall') drawWall(ctx, (1+leftLine)*xStep, (1+leftLine)*xStep, yStep*bottomLine, yStep*(bottomLine-1));
    if(ant.rl === 'entr') drawEntrance(ctx, (1+leftLine)*xStep, (1+leftLine)*xStep, yStep*bottomLine, yStep*(bottomLine-1));
    if(ant.rl === 'exit') drawExit(ctx, (1+leftLine)*xStep, (1+leftLine)*xStep, yStep*bottomLine, yStep*(bottomLine-1));
    if(ant.rl === 'open') drawOpen(ctx, (1+leftLine)*xStep, (1+leftLine)*xStep, yStep*bottomLine, yStep*(bottomLine-1));

    if(ant.bl === 'wall') drawWall(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*bottomLine, yStep*bottomLine);
    if(ant.bl === 'entr') drawEntrance(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*bottomLine, yStep*bottomLine);
    if(ant.bl === 'exit') drawExit(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*bottomLine, yStep*bottomLine);
    if(ant.bl === 'open') drawOpen(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*bottomLine, yStep*bottomLine);
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
        ipc.send('simulate-ants');
    });
});

ipc.on('ant-moved', (evt, ant) => {
    console.log("ant-moved");
    if(!antArray.includes(ant.id)){
        initAnt(ant.id);
        antArray.push(ant.id);
        console.log("added ant");
    }
    let antEl = document.getElementById(`ant${ant.id}`);
    // the shift of the grid + placing the img in the center of the grid block + block size*position
    const antLeft = gridLeft + (xStep - imgWidth)/2 + xStep*(ant.x-1);
    //antEl.style.left =  
    // the shift of the grid from the screen top + placing the im in the center of the grid block + block size*position (y is reveresed)
    const antTop = gridTop + (yStep - imgHeight)/2 + yStep*(yL-ant.y);
    //antEl.style.top = 
    //antEl.style.transform = `rotate(${ant.angle}deg)`;

    anime({
        targets: `#ant${ant.id}`,
        translateX: antLeft,
        translateY: antTop,
        rotate: ant.angle,
        duration: 500
    });

    updateGrid(ant);
});