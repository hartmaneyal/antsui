const electron = require('electron');
const { remote, ipcRenderer : ipc } = electron;
const { Menu, MenuItem } = remote;

const constants = require('./constants');
const anime = require('animejs');

const fs = require('fs');

const emiter = require('./emiter');
var db = require('./db');
var session;

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
let gridRight;
let gridBottom;

const gridLineColor = constants.MAP_GRID_LINE_COLOR;
const specialLineColor = constants.MAP_SPECIAL_LINE_COLOR;
const wallLineColor = constants.MAP_WALL_LINE_COLOR;
const exitLineColor = constants.MAP_EXIT_LINE_COLOR;
const visitedBlock = constants.MAP_VISITED_CELL_COLOR;

let toolTable;

var Stopwatch = require('timer-stopwatch');
var timer = new Stopwatch();

// ==========================
// Drawing the grid functions
// ==========================

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
    gridRight = rect.right;
    gridBottom = rect.bottom;

    resetToolTable();

    console.log('top:' + gridTop + ', left:' + gridLeft);

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

// ==========================
// events
// ==========================

window.addEventListener('DOMContentLoaded', _ => {
    db.databaseInitialize();
    emiter.on('db-init', (ses) => {
        session = ses;
        console.log('session: ' + session);
        ipc.send('set-session', session);
        if(constants.MCAST_AUTO_START) 
            listenerStart();
        else
            drawEmptyGrid(cWidth, cHeight, xL, yL);
    });

    rightClickMenu();
});

function displayMap(){
    drawFullGrid(cWidth, cHeight, xL, yL);
};

ipc.on('display-map', (evt) => {
    displayMap();
});

function simulationStart(){
    drawEmptyGrid(cWidth, cHeight, xL, yL);
        const ants = document.getElementById('ants');
        ants.innerHTML = "";
        antArray = [];
        startTimer();
        ipc.send('simulate-ants');
};

ipc.on('simulation-start', (evt) => {
    simulationStart();
});

ipc.on('ant-moved', (evt, ant) => {
    console.log("ant-moved");
    let newAnt = false;
    if(!antArray.includes(ant.id)){
        initAnt(ant.id);
        antArray.push(ant.id);
        console.log("added ant");
        newAnt = true;
    }

    if(constants.MAP_INVERT_Y){
        console.log('Inverting Y');
        ant.y = constants.MAP_Y_LINES - ant.y + 1;
    }
    db.insertToolRecord(session, ant);

    let antEl = document.getElementById(`ant${ant.id}`);
    // the shift of the grid + placing the img in the center of the grid block + block size*position
    const antLeft = gridLeft + (xStep - imgWidth)/2 + xStep*(ant.x-1);
    //antEl.style.left =  
    // the shift of the grid from the screen top + placing the im in the center of the grid block + block size*position (y is reveresed)
    const antTop = gridTop + (yStep - imgHeight)/2 + yStep*(yL-ant.y);
    //antEl.style.top = 
    //antEl.style.transform = `rotate(${ant.angle}deg)`;

    console.log('ant top:' + antTop + '(' + ant.y + '), ant left:' + antLeft + '(' + ant.x + ')');

    anime({
        targets: `#ant${ant.id}`,
        translateX: antLeft,
        translateY: antTop,
        rotate: ant.angle,
        duration: constants.MAP_ANIME_DURATION
    });

    updateGrid(ant);
    updateToolTable(ant, newAnt);
});

function listenerStart(){
    drawEmptyGrid(cWidth, cHeight, xL, yL);
    const ants = document.getElementById('ants');
    ants.innerHTML = "";
    antArray = [];
    startTimer();
};

// ==========================
// context menu
// ==========================

var contextMenu = new Menu();
let rightClickPosition = null;
function rightClickMenu(){
    contextMenu.append(new MenuItem({ label: 'Mark as not relevant', click(evt) { markNotRelevant(); }, icon: './images/not_relevant.png' }));
    contextMenu.append(new MenuItem({ label: 'Prioritize exploration', click() { markPriority(); }, icon: './images/explore.png' }));
    contextMenu.append(new MenuItem({ label: 'Mark area as blocked', click() { markBlocked(); }, icon: './images/blocked.png' }));
    contextMenu.append(new MenuItem({ label: 'Clear markup', click() { clearMarkup(); }, icon: './images/clear.png' }));
    contextMenu.append(new MenuItem({ type: 'separator' }));
    contextMenu.append(new MenuItem({ label: 'Send ant to entrance', click() { console.log('Ant returning to entrance') }, icon: './images/return.png' }));
    contextMenu.append(new MenuItem({ label: 'Move ant to', click() { console.log('Moving ant to new area') }, icon: './images/go_to.png' }));

    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        rightClickPosition = {x: e.x, y: e.y};
        contextMenu.popup({ window: remote.getCurrentWindow()});
    }, false);
};

function markNotRelevant(){
    console.log('Area marked as not relevant {' + rightClickPosition.x + ',' + rightClickPosition.y + '}');
    if(!isWithinCanvas()){
        console.log('Area not on canvas {' + rightClickPosition.x + ':' + gridRight + ',' + gridLeft + '-' + rightClickPosition.y + ':' + gridTop + ',' + gridBottom + '}');
        return;
    }
    const leftLine = Math.floor( (rightClickPosition.x - gridLeft) / xStep );
    const upperLine = Math.floor( (rightClickPosition.y - gridTop) / yStep );

    gridBlockRecolor(leftLine*xStep, yStep*upperLine, xStep, yStep, constants.MAP_IRRELEVANT_CELL);
    db.storeUiCommand(session, 'MarkNotRelevant', leftLine+1, upperLine);
};

function markPriority(){
    console.log('Area prioritized for exploration {' + rightClickPosition.x + ',' + rightClickPosition.y + '}');
    if(!isWithinCanvas()){
        console.log('Area not on canvas {' + rightClickPosition.x + ':' + gridRight + ',' + gridLeft + '-' + rightClickPosition.y + ':' + gridTop + ',' + gridBottom + '}');
        return;
    }
    const leftLine = Math.floor( (rightClickPosition.x - gridLeft) / xStep );
    const upperLine = Math.floor( (rightClickPosition.y - gridTop) / yStep );
    gridBlockRecolor(leftLine*xStep, yStep*upperLine, xStep, yStep, constants.MAP_PRIORITY_CELL);
    db.storeUiCommand(session, 'MarkPriority', leftLine+1, upperLine);
};

function markBlocked(){
    console.log('Area marked as blocked {' + rightClickPosition.x + ',' + rightClickPosition.y + '}');
    if(!isWithinCanvas()){
        console.log('Area not on canvas {' + rightClickPosition.x + ':' + gridRight + ',' + gridLeft + '-' + rightClickPosition.y + ':' + gridTop + ',' + gridBottom + '}');
        return;
    }
    const leftLine = Math.floor( (rightClickPosition.x - gridLeft) / xStep );
    const upperLine = Math.floor( (rightClickPosition.y - gridTop) / yStep );
    gridBlockRecolor(leftLine*xStep, yStep*upperLine, xStep, yStep, constants.MAP_BLOCKED_CELL);
    db.storeUiCommand(session, 'MarkBlocked', leftLine+1, upperLine);
};

function clearMarkup(){
    console.log('Area marked as blocked {' + rightClickPosition.x + ',' + rightClickPosition.y + '}');
    if(!isWithinCanvas()){
        console.log('Area not on canvas {' + rightClickPosition.x + ':' + gridRight + ',' + gridLeft + '-' + rightClickPosition.y + ':' + gridTop + ',' + gridBottom + '}');
        return;
    }
    const leftLine = Math.floor( (rightClickPosition.x - gridLeft) / xStep );
    const upperLine = Math.floor( (rightClickPosition.y - gridTop) / yStep );
    const ctx = canvas.getContext('2d');
    gridBlockClear(leftLine*xStep, yStep*upperLine, xStep, yStep);
    db.storeUiCommand(session, 'ClearMarkup', leftLine+1, upperLine);
};

function isWithinCanvas(){
    if(rightClickPosition.x > gridRight || rightClickPosition.x < gridLeft) return false;
    if(rightClickPosition.y > gridBottom || rightClickPosition.y < gridTop) return false;
    return true;
};

function gridBlockRecolor(fromx, fromY, width, height, color){
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color; 
    ctx.fillRect(fromx + 2, fromY + 2, width - 4, height - 4);
};

function gridBlockClear(fromx, fromY, width, height){
    const ctx = canvas.getContext('2d');
    ctx.clearRect(fromx + 1, fromY + 1, width - 2, height - 2);
};

// =================
// export data
// =================

ipc.on('export-data', (evt) => {
    if (!fs.existsSync(constants.EXPORT_FOLDER)){
        fs.mkdirSync(constants.EXPORT_FOLDER);
    }
    db.getAllToolData(1);
    db.getUiCommandsData(180);
});

emiter.on('allToolData-ready', (data) => {
    const stream = fs.createWriteStream(constants.EXPORT_FILE_DATA);
    stream.once('open', function(fd) {
        stream.write('[');
        let first = true;
        for(let i = 0; i < data.length; i++){
            if(!first) 
                stream.write(",\n");
            else 
                first = false;
            stream.write(`{"key":${data[i].key},"session":${data[i].session},"id":${data[i].id},"x":${data[i].x},"y":${data[i].y},"battery":${data[i].battery},"tm":${data[i].tm}}`);
        }
        stream.write(']');
        stream.end();
    });
});

emiter.on('getUiCommandsData-ready', (data) => {
    console.log('here');
    const stream = fs.createWriteStream(constants.EXPORT_FILE_COMMANDS);
    stream.once('open', function(fd) {
        stream.write('[');
        let first = true;
        for(let i = 0; i < data.length; i++){
            if(!first) 
                stream.write(",\n");
            else 
                first = false;
            stream.write(`{"session":${data[i].session},"command":${data[i].command},"x":${data[i].x},"y":${data[i].y},"tm":${data[i].tm}}`);
        }
        stream.write(']');
        stream.end();
    });
});

// ==========================
// Tool table control
// ==========================

function resetToolTable(){
    toolTable = document.getElementById('toolTableRecords');
    toolTable.innerHTML = "";

    document.getElementById('totalTools').innerHTML = '0';
    document.getElementById('timeElapssed').innerHTML = '0';

    let allowMock = false;
    if(allowMock){
        for(let i = 0; i < 1; i++){
            const tr = document.createElement("tr");
            const id = document.createElement("td");
            id.innerHTML = 1;
            tr.appendChild(id);

            const x = document.createElement("td");
            x.innerHTML = "<span id='x" + 1 + "'>" + 1 + "</span>";
            tr.appendChild(x);

            const y = document.createElement("td");
            y.innerHTML = "<span id='y" + 1 + "'>" + 1 + "</span>";
            tr.appendChild(y);

            const battery = document.createElement("td");
            battery.innerHTML = "<span id='battery" + 1 + "'>" + 1 + "</span>";
            tr.appendChild(battery);

            const action = document.createElement("td");
            action.innerHTML = "<button type='button' class='btn btn-default' id='action" + 1 + "'>Details</button>";
            tr.appendChild(action);

            toolTable.appendChild(tr);

            document.querySelector('#action1').addEventListener('click', (evt) => {
                ipc.send('tool-details', session, 1);
            });
        }
    }
}

function updateToolTable(ant, newAnt){
    if(newAnt){
        const tr = document.createElement("tr");

        const id = document.createElement("td");
        id.innerHTML = ant.id;
        tr.appendChild(id);

        const x = document.createElement("td");
        x.innerHTML = "<span id='x" + ant.id + "'>" + ant.x + "</span>";
        tr.appendChild(x);

        const y = document.createElement("td");
        y.innerHTML = "<span id='y" + ant.id + "'>" + ant.y + "</span>";
        tr.appendChild(y);

        const battery = document.createElement("td");
        battery.innerHTML = "<span id='battery" + ant.id + "'>" + ant.battery + "</span>";
        tr.appendChild(battery);

        const action = document.createElement("td");
        action.innerHTML = "<button type='button' class='btn btn-default' id='action" + ant.id + "'>Details</button>";
        tr.appendChild(action);

        toolTable.appendChild(tr);

        document.getElementById('totalTools').innerHTML = antArray.length;

        document.querySelector('#action' + ant.id).addEventListener('click', (evt) => {
            console.log(ant.id);
            ipc.send('tool-details', session, ant.id);
        });
    } 
    else{
        document.getElementById('x' + ant.id).innerHTML = ant.x;
        document.getElementById('y' + ant.id).innerHTML = ant.y;
        document.getElementById('battery' + ant.id).innerHTML = (ant.battery > 50 ? ant.battery : "<font color='red'>" + ant.battery + "</font>");
    }
};

// ==========================
// timer functions
// ==========================

function startTimer(){
    timer.reset(0);
    timer.start();
    timer.onTime(function(time) {
        console.log(time.ms);
        document.getElementById('timeElapssed').innerHTML = time.ms / 1000;
    });
};

ipc.on('session-stop', (evt) => {
    console.log("session-stop");
    timer.stop();
});
