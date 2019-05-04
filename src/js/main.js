const electron = require('electron');
const {app, BrowserWindow, globalShortcut, ipcMain: ipc} = electron;

let mainWindow;

app.on('ready', _ => {
    globalShortcut.register('CommandOrControl+Q', _ => {app.quit();})

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

    mainWindow.on('closed', _ =>{
        mainWindow = null;
    });
});

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  };

ipc.on('move-ant', (evt) => {
    mainWindow.webContents.send('ant-moved', {id: 1, x: 118, y: 433, angle: 0, ll:'open', ul:'open', rl:'open', bl:'entr'});
    sleep(500);
    mainWindow.webContents.send('ant-moved', {id: 1, x: 118, y: 333, angle: 0, ll:'wall', ul:'open', rl:'open', bl:'open'});
    sleep(500);
    mainWindow.webContents.send('ant-moved', {id: 1, x: 118, y: 233, angle: 0, ll:'wall', ul:'open', rl:'open', bl:'open'});
    mainWindow.webContents.send('ant-moved', {id: 2, x: 118, y: 433, angle: 0, ll:'open', ul:'open', rl:'open', bl:'entr'});
    sleep(500);
    mainWindow.webContents.send('ant-moved', {id: 1, x: 118, y: 133, angle: 0, ll:'wall', ul:'wall', rl:'open', bl:'open'});
    mainWindow.webContents.send('ant-moved', {id: 2, x: 218, y: 433, angle: 90, ll:'open', ul:'open', rl:'wall', bl:'wall'});
    sleep(500);
    mainWindow.webContents.send('ant-moved', {id: 1, x: 218, y: 133, angle: 90, ll:'open', ul:'wall', rl:'open', bl:'open'});
    mainWindow.webContents.send('ant-moved', {id: 2, x: 218, y: 333, angle: 0, ll:'open', ul:'open', rl:'wall', bl:'open'});
    sleep(500);
    mainWindow.webContents.send('ant-moved', {id: 1, x: 318, y: 133, angle: 90, ll:'open', ul:'wall', rl:'exit', bl:'wall'});
    mainWindow.webContents.send('ant-moved', {id: 2, x: 218, y: 233, angle: 0, ll:'open', ul:'open', rl:'wall', bl:'open'});
});
