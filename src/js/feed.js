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
    document.getElementById('spn').innerHTML = session;

    db.basicInit();
});

emiter.on('basicInit-ready', _ => {
    console.log('DB Ready');
    db.getToolList(session);
});

emiter.on('toolList-ready', (evt, data) => {
    console.log('Tool list recieved: ' + data);
});