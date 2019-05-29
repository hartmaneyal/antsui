const electron = require('electron');
const {app} = electron;

const net = require('net');
const protobuf = require("protobufjs");

const emiter = require('./emiter');
const constants = require('./constants');

const socketTimeout = constants.SERVER_SOCKET_TIMEOUT; // in seconds
const maxAnts = constants.SERVER_MAX_TOOLS;

// Telemetry-Protobuff init
let TelemetryMessage;
function initProtoBuf(){
  protobuf.load(`${app.getAppPath()}/src/js/telemetryMessage.proto`, function(err, root) {
    if (err)
        throw err;

    TelemetryMessage = root.lookupType("telemetrypackage.TelemetryMessage");
  });
};

var serverMode;
var videoElement;

// ======================
// Create listener/server
// ======================
exports.startupServer = (mode, video) => {
    serverMode = mode;
    videoElement = video;

    if(serverMode == 'TELEMETY') initProtoBuf();
    const server = net.createServer();
    server.on('connection', function(socket){
        console.log('SERVER:: REMOTE Socket is listening at port : ' + socket.remotePort);
        console.log('SERVER:: REMOTE Socket ip :' + socket.remoteAddress);
        console.log('SERVER:: REMOTE Socket is IP4/IP6 : ' + socket.remoteFamily);

        socket.setTimeout(socketTimeout * constants.SERVER_SOCKET_TIMEOUT_MS, function(){
            console.log('SERVER:: Socket timed out');
            socket.end('SERVER:: Timed out!');
        });

        socket.on('data', function(data){
            var bread = socket.bytesRead;
            var bwrite = socket.bytesWritten;
            console.log('SERVER:: Bytes read : ' + bread);
            console.log('SERVER:: Bytes written : ' + bwrite);
            console.log('SERVER:: Data sent to server : ' + data);

            if(serverMode == 'TELEMETY'){
                const message = TelemetryMessage.decode(data);
                socket.end("SERVER:: Transfer complete successfully");
                console.log('SERVER:: Message:' + message);
                emiter.emit('ant-move-data', message);
            }
            if(serverMode == 'VIDEO'){
                videoElement.src = window.URL.createObjectURL(data)
            }
        });

        socket.on('timeout', function(){
            console.log('SERVER:: Socket timed out !');
            socket.end('SERVER:: Timed out!');
        });

        socket.on('end', function(data){
            console.log('SERVER:: Socket ended from other end!');
            console.log('SERVER:: End data : ' + data);
        });

        socket.on('close', function(error){
            var bread = socket.bytesRead;
            var bwrite = socket.bytesWritten;
            console.log('SERVER:: Bytes read : ' + bread);
            console.log('SERVER:: Bytes written : ' + bwrite);
            console.log('SERVER:: Socket closed!');
            if(error){
            console.log('SERVER:: Socket was closed coz of transmission error');
            }
        }); 

        setTimeout(function(){
            var isdestroyed = socket.destroyed;
            console.log('SERVER:: Socket destroyed:' + isdestroyed);
            socket.destroy();
        },socketTimeout * constants.SERVER_SOCKET_TIMEOUT_MS);
    });

    server.on('error',function(error){
        console.log('SERVER:: Error: ' + error);
    });

    server.maxConnections = maxAnts;
    if(serverMode == 'TELEMETY') server.listen(constants.SERVER_PORT, 'localhost');
    if(serverMode == 'VIDEO') server.listen(constants.VIDEO_PORT, 'localhost');
};