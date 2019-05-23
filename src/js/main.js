const electron = require('electron');
const {app, BrowserWindow, globalShortcut, ipcMain: ipc} = electron;

const net = require('net');
const protobuf = require("protobufjs");

const server = require('./server');
const emiter = require('./emiter');
const constants = require('./constants');

// ====================
// Electron main window
// ====================
let mainWindow;
app.on('ready', _ => {
    globalShortcut.register('CommandOrControl+Q', _ => {app.quit();})

    initProtoBuf();
    server.startupServer();

    mainWindow = new BrowserWindow({
        width: constants.MAIN_WINDOW_WIDTH,
        height: constants.MAIN_WINDOW_HEIGHT,
        resizeable: false,
        "webPreferences":{
            //"webSecurity":false,
            nodeIntegration: true,
            nodeIntegrationInWorker: true
          }
    });

    mainWindow.loadURL(`file://${app.getAppPath()}/src/html/canvas.html`);
    mainWindow.setResizable(false);
    //mainWindow.webContents.openDevTools();

    emiter.on('ant-move-data', (message) => {
      console.log('Passing to UI');
      mainWindow.webContents.send('ant-moved', message);
    });

    mainWindow.on('closed', _ =>{
        mainWindow = null;
    });
});

// ==============
// details window
// ==============

ipc.on('tool-details', (evt, session, antId) => {
    console.log(antId);

    let toolWindow;
    toolWindow = new BrowserWindow({
        width: constants.TOOL_WINDOW_WIDTH,
        height: constants.TOOL_WINDOW_HEIGHT,
        resizeable: false,
        "webPreferences":{
            //"webSecurity":false,
            nodeIntegration: true,
            nodeIntegrationInWorker: true
          }
    });

    toolWindow.loadURL(`file://${app.getAppPath()}/src/html/tool.html?session=${session}&id=${antId}`);
    toolWindow.setResizable(false);
    toolWindow.on('closed', _ =>{
        toolWindow = null;
    });
});

// ===============
// Simulative data
// ===============

// Telemetry-Protobuff init
let TelemetryMessage;
function initProtoBuf(){
  protobuf.load(`${app.getAppPath()}/src/js/telemetryMessage.proto`, function(err, root) {
    if (err)
        throw err;

    TelemetryMessage = root.lookupType("telemetrypackage.TelemetryMessage");
  });
};

ipc.on('simulate-ants', (evt) => {
    let payloads = [];
    payloads.push({id: 1, x: 2, y: 1, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});  //1
    payloads.push({id: 1, x: 2, y: 2, angle: 0, ll:constants.MAP_ENUM_WALL, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_OPEN, battery:90});  //2
    payloads.push({id: 1, x: 2, y: 3, angle: 0, ll:constants.MAP_ENUM_WALL, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_OPEN, battery:80});  //3
    payloads.push({id: 2, x: 2, y: 1, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});  //3
    payloads.push({id: 1, x: 2, y: 4, angle: 0, ll:constants.MAP_ENUM_WALL, ul:constants.MAP_ENUM_WALL, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_OPEN, battery:70});  //4
    payloads.push({id: 2, x: 3, y: 1, angle: 90, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_WALL, bl:constants.MAP_ENUM_WALL, battery:90}); //4
    payloads.push({id: 1, x: 3, y: 4, angle: 90, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_WALL, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_OPEN, battery:60}); //5
    payloads.push({id: 2, x: 3, y: 2, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_WALL, bl:constants.MAP_ENUM_OPEN, battery:80});  //5
    payloads.push({id: 1, x: 4, y: 4, angle: 90, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_WALL, rl:constants.MAP_ENUM_EXIT, bl:constants.MAP_ENUM_WALL, battery:50}); //6
    payloads.push({id: 2, x: 3, y: 3, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_WALL, bl:constants.MAP_ENUM_OPEN, battery:70});  //6

    for(let i = 0; i <= payloads.length; ++i){
        setTimeout(_ => {
            const payload = payloads[i];
            const errMsg = TelemetryMessage.verify(payload);
            if (errMsg){
                console.log('Error:' + errMsg);
                return;
            }
            else{
                const message = TelemetryMessage.create(payload);
                var buffer = TelemetryMessage.encode(message).finish();

                const client = net.connect(constants.SERVER_PORT, 'localhost', function() {
                    console.log('CLIENT:: Connected');
                    client.write(buffer);
                    client.end();
                    if(i == payloads.length - 1) mainWindow.webContents.send('session-stop');
                });
                client.on('data', (data) => {
                    console.log('CLIENT:: ' + data.toString());
                    client.end();
                    if(i == payloads.length - 1) mainWindow.webContents.send('session-stop');
                });
                client.on('end', () => {
                    console.log('CLIENT:: disconnected from server');
                });

                if(i == payloads.length - 1) mainWindow.webContents.send('session-stop');
            }
        }, i * constants.SIMULATION_SPEED_MS);
    }
});
