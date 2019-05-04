const electron = require('electron');
const {app, BrowserWindow, globalShortcut, ipcMain: ipc} = electron;

let mainWindow;

app.on('ready', _ => {
    globalShortcut.register('CommandOrControl+Q', _ => {app.quit();})

    mainWindow = new BrowserWindow({
        width: 900,
        height: 800,
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
    mainWindow.webContents.send('ant-moved', {id: 1, x: 118, y: 413, angle: 0});
    sleep(500);
    mainWindow.webContents.send('ant-moved', {id: 1, x: 118, y: 313, angle: 0});
    sleep(500);
    mainWindow.webContents.send('ant-moved', {id: 1, x: 118, y: 213, angle: 0});
    mainWindow.webContents.send('ant-moved', {id: 2, x: 118, y: 413, angle: 0});
    sleep(500);
    mainWindow.webContents.send('ant-moved', {id: 1, x: 118, y: 113, angle: 0});
    mainWindow.webContents.send('ant-moved', {id: 2, x: 218, y: 413, angle: 90});
    sleep(500);
    mainWindow.webContents.send('ant-moved', {id: 1, x: 218, y: 113, angle: 90});
    mainWindow.webContents.send('ant-moved', {id: 2, x: 318, y: 413, angle: 90});
    sleep(500);
    mainWindow.webContents.send('ant-moved', {id: 1, x: 318, y: 113, angle: 90});
    mainWindow.webContents.send('ant-moved', {id: 2, x: 318, y: 313, angle: 0});
});
