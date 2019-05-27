const electron = require('electron');
const { remote, ipcRenderer : ipc } = electron;

const emiter = require('./emiter');
var db = require('./db');

var session;
var id;
var toolTable;
var gaugeLabel;
var gauge;
window.addEventListener('DOMContentLoaded', _ => {
    let srch = global.location.search;
    let parts = srch.split('&');

    session = parts[0].split('=')[1];
    id = parts[1].split('=')[1];

    document.getElementById('spn').innerHTML = id;

    toolTable = document.getElementById('toolTableRecords');
    gaugeLabel = document.getElementById('gaugeLabel');
    gauge = document.getElementById('gauge');

    db.basicInit();
});

emiter.on('basicInit-ready', _ => {
    console.log('DB Ready');
    setInterval(_ => {
        db.getToolData(session, id, lastKey);
    }, 1000);
});

var lastKey = -1;

emiter.on('toolData-ready', (data) => {
    console.log('Data refreshed');  
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
            setGauge(data[i].battery);
        }
    }
});

var lastValue = 100;
function setGauge(value){
    gaugeLabel.innerHTML = value + '%';
    gauge.style.strokeDasharray = value + "," + lastValue;
    if(value <= 75 && value > 50){
        gauge.classList.remove('circle');
        gauge.classList.add('circleWarn');
        gauge.style.webkitAnimationPlayState="running";
    }
    if(value <= 50 && value > 25){
        gauge.classList.remove('circle');
        gauge.classList.add('circleWarnSv');
        gauge.style.webkitAnimationPlayState="running";
    }
    if(value <= 25){
        gauge.classList.remove('circle');
        gauge.classList.add('circleAlert');
        gauge.style.webkitAnimationPlayState="running";
    }
    lastValue = value;
};