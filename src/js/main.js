const electron = require('electron');
const {app, BrowserWindow, globalShortcut, ipcMain: ipc, Menu, dialog} = electron;

//const net = require('net');
const dgram = require('dgram');
const protobuf = require("protobufjs");

const fs = require('fs');

const server = require('./server');
const emiter = require('./emiter');
const constants = require('./constants');

// ====================
// Electron main window
// ====================
let mainWindow;
app.on('ready', _ => {
    globalShortcut.register('CommandOrControl+Q', _ => {app.quit();})
    globalShortcut.register('CommandOrControl+R', _ => {mainWindow.reload();})

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

    mainWindow.loadURL(`file://${app.getAppPath()}/src/html/main.html`);
    mainWindow.setResizable(false);
    //mainWindow.webContents.openDevTools();

    emiter.on('ant-move-data', (message) => {
      console.log('Passing to UI');
      mainWindow.webContents.send('ant-moved', message);
    });

    mainWindow.on('closed', _ =>{
        mainWindow = null;
    });

    // Main menu
    setMainMenu();
});

// ================
// application menu
// ================

function setMainMenu(){
    const name = 'Ants UI';
    const template = [{
        label: name,
        submenu: [{
            label: `About ${name}`,
            click: _ => {
                console.log(`Ants UI ${constants.APP_VERSION}`);

                const options = {
                    type: 'info',
                    title: 'About Ants UI',
                    message: `Ants UI ${constants.APP_VERSION}`,
                    detail: 'UI for presenting ant movements in a maze'
                };

                dialog.showMessageBox(null, options);
            }
        }, {
            type: 'separator'
        }, {
            label: 'Quit',
            click: _ => {
                app.quit();
            },
            accelerator: 'CommandOrControl+Q'
        }]
    }, { 
        label: 'Simulation',
        submenu:[{
            label: 'Show result map',
            click: _ => { mainWindow.webContents.send('display-map'); }
        }, {
            label: 'Simulate ants',
            click: _ => { mainWindow.webContents.send('simulation-start'); }
        }, {
            label: 'Call real ant',
            click: _ => { mainWindow.webContents.send('simulate-real_ant'); }
        },{
            type: 'separator'
        }, {
            label: 'Open Dev tools',
            click: _ => {
                mainWindow.webContents.openDevTools();
            }
        }]
    }, { 
        label: 'Tools',
        submenu:[{
            label: 'Tools feed',
            click: _ => { toolFeed(); }
        }, {
            label: 'Fold Ants',
            click: _ => { console.log('Folding all ants'); }
        }, {
            label: 'Export simulation',
            click: _ => { mainWindow.webContents.send('export-data'); }
        }]
    }];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};

function setFeedMenu(){
    const name = 'Ants UI';
    const template = [{
        label: name,
        submenu: [{
            label: `About ${name}`,
            click: _ => {
                console.log(`Ants UI ${constants.APP_VERSION}`);

                const options = {
                    type: 'info',
                    title: 'About Ants UI',
                    message: `Ants UI ${constants.APP_VERSION}`,
                    detail: 'UI for presenting ant movements in a maze'
                };

                dialog.showMessageBox(null, options);
            }
        }, {
            type: 'separator'
        }, {
            label: 'Quit',
            click: _ => {
                app.quit();
            },
            accelerator: 'CommandOrControl+Q'
        }]
    }, { 
        label: 'Simulation',
        submenu:[{
            label: 'Open Dev tools',
            click: _ => {
                feedWindow.webContents.openDevTools();
            }
        }]
    }];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// ==============
// details window
// ==============

ipc.on('tool-details', (evt, session, antId) => {
    console.log(antId + ',' + session);

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

// =================
// video feed window
// =================

var sessionId;
ipc.on('set-session', (evt, session) => {
    sessionId = session;
});

let feedWindow;
function toolFeed(){
    feedWindow = new BrowserWindow({
        width: constants.FEED_WINDOW_WIDTH,
        height: constants.FEED_WINDOW_HEIGHT,
        resizeable: false,
        "webPreferences":{
            //"webSecurity":false,
            nodeIntegration: true,
            nodeIntegrationInWorker: true
          }
    });

    feedWindow.loadURL(`file://${app.getAppPath()}/src/html/feed.html?session=${sessionId}`);
    feedWindow.setResizable(false);
    feedWindow.on('closed', _ =>{
        feedWindow = null;
        setMainMenu();
    });

    setFeedMenu();
};

// algorithm server commands
ipc.on('ui-command', (evt, x, y, action) => {
    console.log('Sending UI command ' + action);
    server.sendUiCommand(x, y, action);
});

// ===============
// Simulative data
// ===============

// Telemetry-Protobuff init
let TelemetryMessage;
function initProtoBuf(){
  protobuf.load(`${app.getAppPath()}/src/proto/telemetryMessage.proto`, function(err, root) {
    if (err)
        throw err;

    TelemetryMessage = root.lookupType("telemetrypackage.TelemetryMessage");
  });
};

ipc.on('simulate-ants', (evt) => {
    let payloads = [];
    payloads.push({id: 1, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100, type:constants.ANT_SCOUT});  //1
    payloads.push({id: 1, x: 2, y: 29, angle: 0, ll:constants.MAP_ENUM_WALL, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_OPEN, battery:90, type:constants.ANT_SCOUT});  //2
    payloads.push({id: 1, x: 2, y: 28, angle: 0, ll:constants.MAP_ENUM_WALL, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_OPEN, battery:80, type:constants.ANT_SCOUT});  //3
    payloads.push({id: 2, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100, type:constants.ANT_SCOUT});  //3
    payloads.push({id: 1, x: 2, y: 27, angle: 0, ll:constants.MAP_ENUM_WALL, ul:constants.MAP_ENUM_WALL, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_OPEN, battery:70, type:constants.ANT_SCOUT});  //4
    payloads.push({id: 2, x: 3, y: 30, angle: 90, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_WALL, bl:constants.MAP_ENUM_WALL, battery:90, type:constants.ANT_SCOUT}); //4
    payloads.push({id: 1, x: 3, y: 27, angle: 90, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_WALL, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_OPEN, battery:60, type:constants.ANT_SCOUT}); //5
    payloads.push({id: 2, x: 3, y: 29, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_WALL, bl:constants.MAP_ENUM_OPEN, battery:80, type:constants.ANT_SCOUT});  //5
    payloads.push({id: 1, x: 4, y: 27, angle: 90, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_WALL, rl:constants.MAP_ENUM_EXIT, bl:constants.MAP_ENUM_WALL, battery:50, type:constants.ANT_SCOUT}); //6
    payloads.push({id: 2, x: 3, y: 28, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_WALL, bl:constants.MAP_ENUM_OPEN, battery:70, type:constants.ANT_TRANSMISSION});  //6

    /*
    payloads.push({id: 3, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    payloads.push({id: 4, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    payloads.push({id: 5, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    payloads.push({id: 6, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    payloads.push({id: 7, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    payloads.push({id: 8, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    payloads.push({id: 9, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    payloads.push({id: 10, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    payloads.push({id: 11, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    payloads.push({id: 12, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    payloads.push({id: 13, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    payloads.push({id: 14, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    payloads.push({id: 15, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    payloads.push({id: 16, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    payloads.push({id: 17, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    payloads.push({id: 18, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100});
    */
   
    for(let i = 0; i < payloads.length; i++){
        setTimeout(_ => {
            const payload = payloads[i];
            const errMsg = TelemetryMessage.verify(payload);
            if (errMsg){
                console.log('Error:' + errMsg);
                return;
            }
            else{
                const message = TelemetryMessage.create(payload);
                const buffer = TelemetryMessage.encode(message).finish();

               const client = dgram.createSocket('udp4');
               client.send(buffer, constants.MCAST_PORT, 'localhost', (err) => {
                   if (err != null) console.log('Err: ' + err);
                   client.close();
               });

                if(i == payloads.length - 1) mainWindow.webContents.send('session-stop');
            }
        }, i * constants.SIMULATION_SPEED_MS);
    }
});

const request = require('request');
ipc.on('simulate-real_ants', (evt) => {
    const client = dgram.createSocket('udp4');
    client.send('UI:START', constants.SIM_SERVER_PORT, constants.SIM_SERVER_IP, (err) => {
        if (err != null) console.log('Err: ' + err);
            client.close();
    });
});

ipc.on('simulate-real_ants_old', (evt) => {
    let payloads = [];
    let commands = [];
    const ant = 1;
    payloads.push({id: ant, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100, type:constants.ANT_SCOUT});  //1
    commands.push('f1');
    payloads.push({id: ant, x: 2, y: 29, angle: 0, ll:constants.MAP_ENUM_WALL, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_OPEN, battery:90, type:constants.ANT_SCOUT});  //2
    commands.push('f1');
    payloads.push({id: ant, x: 2, y: 28, angle: 0, ll:constants.MAP_ENUM_WALL, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_OPEN, battery:80, type:constants.ANT_SCOUT});  //3
    commands.push('f1');
    payloads.push({id: ant, x: 2, y: 27, angle: 90, ll:constants.MAP_ENUM_WALL, ul:constants.MAP_ENUM_WALL, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_OPEN, battery:70, type:constants.ANT_SCOUT});  //4
    commands.push('r1');
    payloads.push({id: ant, x: 2, y: 27, angle: 90, ll:constants.MAP_ENUM_WALL, ul:constants.MAP_ENUM_WALL, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_OPEN, battery:70, type:constants.ANT_SCOUT});  //4
    commands.push('f1');
    payloads.push({id: ant, x: 3, y: 27, angle: 90, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_WALL, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_OPEN, battery:60, type:constants.ANT_SCOUT}); //5
    commands.push('NULL');
    //payloads.push({id: 2, x: 2, y: 30, angle: 0, ll:constants.MAP_ENUM_OPEN, ul:constants.MAP_ENUM_OPEN, rl:constants.MAP_ENUM_OPEN, bl:constants.MAP_ENUM_ENTRY, battery:100, type:constants.ANT_SCOUT});  //1
    //commands.push('f2');

    for(let i = 0; i < payloads.length; i++){
        setTimeout(_ => {
            const payload = payloads[i];
            const errMsg = TelemetryMessage.verify(payload);
            if (errMsg){
                console.log('Error:' + errMsg);
                return;
            }
            else{
                const message = TelemetryMessage.create(payload);
                const buffer = TelemetryMessage.encode(message).finish();

               //const client = dgram.createSocket('udp4');
               //client.send(buffer, constants.MCAST_PORT, 'localhost', (err) => {
               //    if (err != null) console.log('Err: ' + err);
               //    client.close();
               //});

               if(commands[i] !== 'NULL'){
                    arr = commands[i].split(',');
                        for(let j = 0; j < arr.length; j++){
                        request({
                        method: 'PUT',
                        url: 'http://' + constants.ANT_SERVER_IP + ':' + constants.ANT_SERVER_PORT + '/api/ants/' + payload.id,
                        body: { "antCommandsArr": [arr[j]] },
                        json: true,
                        headers: {
                            'User-Agent': 'request'
                        }
                        }, (err, res, body) => {
                            //console.log(res);
                            console.log(err);
                        });
                    }
               }

                //if(i == payloads.length - 1) mainWindow.webContents.send('session-stop');
            }
        }, i * constants.ANT_SPEED_MS);
    }
});