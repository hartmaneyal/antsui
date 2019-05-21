const electron = require('electron');
const { remote, ipcRenderer : ipc } = electron;

const constants = require('./constants');
const anime = require('animejs');

var db = require('./db');
db.databaseInitialize();

let canvas;
let antArray;
const cWidth = constants.MAP_WIDTH;
const cHeight = constants.MAP_HEIGHT;
const xL = constants.MAP_X_LINES;
const yL = constants.MAP_Y_LINES;
const xStep = cWidth / xL;
const yStep = cHeight / yL;
const imgWidth = xStep/2;
const imgHeight = yStep/2;
let gridTop;
let gridLeft;

const gridLineColor = constants.MAP_GRID_LINE_COLOR;
const specialLineColor = constants.MAP_SPECIAL_LINE_COLOR;
const wallLineColor = constants.MAP_WALL_LINE_COLOR;
const exitLineColor = constants.MAP_EXIT_LINE_COLOR;
const visitedBlock = constants.MAP_VISITED_CELL_COLOR;

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
    ctx.fillStyle = visitedBlock; 
    ctx.fillRect(fromx + 2, fromY + 2, width - 4, height - 4);
};

function drawEmptyGrid(canvasWidth, canvasHeight, xLines, yLines){
    var ctx = initGrid(canvasWidth, canvasHeight);

    drawGridLines(ctx, canvasWidth, canvasHeight, xStep, yStep);
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

    if(ant.ll === constants.MAP_ENUM_WALL) drawWall(ctx, leftLine*xStep, leftLine*xStep, yStep*bottomLine, yStep*(bottomLine-1));
    if(ant.ll === constants.MAP_ENUM_ENTRY) drawEntrance(ctx, leftLine*xStep, leftLine*xStep, yStep*bottomLine, yStep*(bottomLine-1)); 
    if(ant.ll === constants.MAP_ENUM_EXIT) drawExit(ctx, leftLine*xStep, leftLine*xStep, yStep*bottomLine, yStep*(bottomLine-1));
    if(ant.ll === constants.MAP_ENUM_OPEN) drawOpen(ctx, leftLine*xStep, leftLine*xStep, yStep*bottomLine, yStep*(bottomLine-1));
    
    if(ant.ul === constants.MAP_ENUM_WALL) drawWall(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*(bottomLine-1), yStep*(bottomLine-1));
    if(ant.ul === constants.MAP_ENUM_ENTRY) drawEntrance(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*(bottomLine-1), yStep*(bottomLine-1));
    if(ant.ul === constants.MAP_ENUM_EXIT) drawExit(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*(bottomLine-1), yStep*(bottomLine-1));
    if(ant.ul === constants.MAP_ENUM_OPEN) drawOpen(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*(bottomLine-1), yStep*(bottomLine-1));
    
    if(ant.rl === constants.MAP_ENUM_WALL) drawWall(ctx, (1+leftLine)*xStep, (1+leftLine)*xStep, yStep*bottomLine, yStep*(bottomLine-1));
    if(ant.rl === constants.MAP_ENUM_ENTRY) drawEntrance(ctx, (1+leftLine)*xStep, (1+leftLine)*xStep, yStep*bottomLine, yStep*(bottomLine-1));
    if(ant.rl === constants.MAP_ENUM_EXIT) drawExit(ctx, (1+leftLine)*xStep, (1+leftLine)*xStep, yStep*bottomLine, yStep*(bottomLine-1));
    if(ant.rl === constants.MAP_ENUM_OPEN) drawOpen(ctx, (1+leftLine)*xStep, (1+leftLine)*xStep, yStep*bottomLine, yStep*(bottomLine-1));

    if(ant.bl === constants.MAP_ENUM_WALL) drawWall(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*bottomLine, yStep*bottomLine);
    if(ant.bl === constants.MAP_ENUM_ENTRY) drawEntrance(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*bottomLine, yStep*bottomLine);
    if(ant.bl === constants.MAP_ENUM_EXIT) drawExit(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*bottomLine, yStep*bottomLine);
    if(ant.bl === constants.MAP_ENUM_OPEN) drawOpen(ctx, leftLine*xStep, xStep*(leftLine+1), yStep*bottomLine, yStep*bottomLine);
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
    db.insertToolRecord(ant);

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
        duration: constants.MAP_ANIME_DURATION
    });

    updateGrid(ant);
});
