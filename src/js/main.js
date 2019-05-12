const electron = require('electron');
const {app, BrowserWindow, globalShortcut, ipcMain: ipc} = electron;

const net = require('net');
const protobuf = require("protobufjs");

const server = require('./server');
const emiter = require('./emiter');

// ===============
// Electron window
// ===============
let mainWindow;
app.on('ready', _ => {
    globalShortcut.register('CommandOrControl+Q', _ => {app.quit();})

    initProtoBuf();
    server.startupServer();

    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        resizeable: false,
        "webPreferences":{
            //"webSecurity":false,
            nodeIntegration: true,
            nodeIntegrationInWorker: true
          }
    });

    mainWindow.loadURL(`file://${app.getAppPath()}/src/html/canvas.html`);
    //mainWindow.webContents.openDevTools();

    emiter.on('ant-move-data', (message) => {
      console.log('Passing to UI');
      mainWindow.webContents.send('ant-moved', message);
    });

    mainWindow.on('closed', _ =>{
        mainWindow = null;
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
    payloads.push({id: 1, x: 2, y: 1, angle: 0, ll:'open', ul:'open', rl:'open', bl:'entr'});  //1
    payloads.push({id: 1, x: 2, y: 2, angle: 0, ll:'wall', ul:'open', rl:'open', bl:'open'});  //2
    payloads.push({id: 1, x: 2, y: 3, angle: 0, ll:'wall', ul:'open', rl:'open', bl:'open'});  //3
    payloads.push({id: 2, x: 2, y: 1, angle: 0, ll:'open', ul:'open', rl:'open', bl:'entr'});  //3
    payloads.push({id: 1, x: 2, y: 4, angle: 0, ll:'wall', ul:'wall', rl:'open', bl:'open'});  //4
    payloads.push({id: 2, x: 3, y: 1, angle: 90, ll:'open', ul:'open', rl:'wall', bl:'wall'}); //4
    payloads.push({id: 1, x: 3, y: 4, angle: 90, ll:'open', ul:'wall', rl:'open', bl:'open'}); //5
    payloads.push({id: 2, x: 3, y: 2, angle: 0, ll:'open', ul:'open', rl:'wall', bl:'open'});  //5
    payloads.push({id: 1, x: 4, y: 4, angle: 90, ll:'open', ul:'wall', rl:'exit', bl:'wall'}); //6
    payloads.push({id: 2, x: 3, y: 3, angle: 0, ll:'open', ul:'open', rl:'wall', bl:'open'});  //6

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

                const client = net.connect(1337, 'localhost', function() {
                    console.log('CLIENT:: Connected');
                    client.write(buffer);
                    client.end();
                });
                client.on('data', (data) => {
                    console.log('CLIENT:: ' + data.toString());
                    client.end();
                });
                client.on('end', () => {
                    console.log('CLIENT:: disconnected from server');
                });
            }
        }, i * 500);
    }
});
