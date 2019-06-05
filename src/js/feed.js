const electron = require('electron');
const { remote, ipcRenderer : ipc } = electron;

const constants = require('./constants');
const emiter = require('./emiter');
var db = require('./db');
var session;

window.addEventListener('DOMContentLoaded', _ => {
    let srch = global.location.search;
    let parts = srch.split('&');

    session = parts[0].split('=')[1];
    document.getElementById('spn').innerHTML = "(session:" + session + ")";
    
    db.basicInit();
});

emiter.on('basicInit-ready', _ => {
    console.log('DB Ready');
    db.getToolList(session);
});

emiter.on('toolList-ready', (data) => {
    console.log('Tool list recieved: ' + data);

    const feedDiv = document.getElementById('tools');
    let rowDiv = createRowDiv();
    let toolColumns = 0;
    let usedColumns = 0;
    for(let i = 0; i < data.length; i++){
        toolColumns++;
        if(toolColumns > constants.FEED_COLUMNS){
            feedDiv.appendChild(rowDiv);
            rowDiv = createRowDiv();
            toolColumns = 0;
            usedColumns = 0;
        }
        let colDiv = createColumnDiv();
        colDiv.appendChild(createHeaderDiv(data[i]));
        colDiv.appendChild(createVideoFeed());
        rowDiv.appendChild(colDiv);
        usedColumns++;
    }
    if(usedColumns > 0){
        feedDiv.appendChild(rowDiv);
    }
});

function createRowDiv(){
    const div = document.createElement('div');
    div.classList.add('row');
    return div;
};

function createColumnDiv(){
    const div = document.createElement('div');
    const clsSize = 12/constants.FEED_COLUMNS;
    div.classList.add('col-md-' + clsSize);
    div.classList.add('col-sm-' + clsSize);
    div.classList.add('borderedDiv');
    return div;
};

function createHeaderDiv(toolId){
    const div = document.createElement('div');
    div.classList.add('feedElementHeader');
    div.innerHTML = "Tool ID " + toolId;
    return div;
}

function createVideoFeed(){
    const video = document.createElement('video');
    video.classList.add('feedElement');
    video.src = "../../images/stream.mp4";
    video.type="video/mp4";
    video.autoplay = true;
    return video;
}