const electron = require('electron');
const {app} = electron;

const net = require('net');
const protobuf = require("protobufjs");

const emiter = require('./emiter');

const socketTimeout = 6; // in seconds
const maxAnts = 10;

// Telemetry-Protobuff init
let TelemetryMessage;
function initProtoBuf(){
  protobuf.load(`${app.getAppPath()}/src/js/telemetryMessage.proto`, function(err, root) {
    if (err)
        throw err;

    TelemetryMessage = root.lookupType("telemetrypackage.TelemetryMessage");
  });
};

// ======================
// Create listener/server
// ======================
exports.startupServer = () => {
    initProtoBuf();
    const server = net.createServer();
    server.on('connection', function(socket){
    console.log('SERVER:: REMOTE Socket is listening at port : ' + socket.remotePort);
    console.log('SERVER:: REMOTE Socket ip :' + socket.remoteAddress);
    console.log('SERVER:: REMOTE Socket is IP4/IP6 : ' + socket.remoteFamily);

    socket.setTimeout(socketTimeout*1000, function(){
        console.log('SERVER:: Socket timed out');
        socket.end('SERVER:: Timed out!');
    });

    socket.on('data', function(data){
        var bread = socket.bytesRead;
        var bwrite = socket.bytesWritten;
        console.log('SERVER:: Bytes read : ' + bread);
        console.log('SERVER:: Bytes written : ' + bwrite);
        console.log('SERVER:: Data sent to server : ' + data);

        const message = TelemetryMessage.decode(data);
        socket.end("SERVER:: Transfer complete successfully");
        console.log('SERVER:: Message:' + message);
        emiter.emit('ant-move-data', message);
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
    },socketTimeout*1000);
    });

    server.on('error',function(error){
    console.log('SERVER:: Error: ' + error);
    });

    server.maxConnections = maxAnts;
    server.listen(1337, 'localhost');
};