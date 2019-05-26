const electron = require('electron');
const { remote, ipcRenderer : ipc } = electron;

const LinearGauge = require('canvas-gauges').LinearGauge;
let gauge;

const emiter = require('./emiter');
var db = require('./db');

var session;
var id;
window.addEventListener('DOMContentLoaded', _ => {
    let srch = global.location.search;
    let parts = srch.split('&');

    session = parts[0].split('=')[1];
    id = parts[1].split('=')[1];

    document.getElementById('spn').innerHTML = id;
    setupGauge();

    db.basicInit();
});

function setupGauge(){
    gauge = new LinearGauge({
        renderTo: 'batteryGauge',
        width: 250,
        height: 100,
        minValue: 0,
        maxValue: 100,
        majorTicks: [ "0", "20", "40", "60", "80", "100" ],
        minorTicks: 10,
        strokeTicks: true,
        colorPlate: "#222",
        borderShadowWidth: 0,
        borders: false,
        barBeginCircle: false,
        tickSide: "left",
        numberSide: "left",
        needleSide: "left",
        needleType: "line",
        needleWidth: 3,
        colorNeedle: "#fff",
        colorNeedleEnd: "#fff",
        animationDuration: 1500,
        animationRule: "linear",
        animationTarget: "plate",
        barWidth: 5,
        ticksWidth: 50,
        ticksWidthMinor: 15,
        colorTitle: "#eee",
        colorNumbers: "#eee",
        highlights: [
            { "from": 0, "to": 25, "color": "rgba(0,0, 255, .3)" },
            { "from": 26, "to": 50, "color": "rgba(255, 0, 0, .3)" }
        ],
    }).draw();
};

emiter.on('basicInit-ready', _ => {
    console.log('DB Ready');
    setInterval(_ => {
        db.getToolData(session, id, lastKey);
    }, 1000);
});

var lastKey = -1;
let batteryLevel = -1;
emiter.on('toolData-ready', (data) => {
    console.log('Data refreshed');
    let toolTable = document.getElementById('toolTableRecords');
    for(let i = 0; i < data.length; i++){
        const tr = document.createElement("tr");

        const id = document.createElement("td");
        id.innerHTML = data[i].id;
        tr.appendChild(id);

        const x = document.createElement("td");
        x.innerHTML = "<span id='x" + data[i].id + "'>" + data[i].x + "</span>";
        tr.appendChild(x);

        const y = document.createElement("td");
        y.innerHTML = "<span id='y" + data[i].id + "'>" + data[i].y + "</span>";
        tr.appendChild(y);

        const battery = document.createElement("td");
        battery.innerHTML = "<span id='battery" + data[i].id + "'>" + data[i].battery + "</span>";
        tr.appendChild(battery);

        toolTable.appendChild(tr);

        if(data[i].key > lastKey) {
            lastKey = data[i].key;
            batteryLevel = data[i].battery;
        }
    }
    gauge.value = batteryLevel;
});