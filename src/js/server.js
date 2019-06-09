const electron = require('electron');
const {app} = electron;

//const net = require('net');
const dgram = require('dgram');
const protobuf = require("protobufjs");

const emiter = require('./emiter');
const constants = require('./constants');

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
    const client = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    client.on('listening', function () {
        const address = client.address();
        console.log('UDP Client listening on ' + address.address + ":" + address.port);
        client.setBroadcast(true)
        client.setMulticastTTL(constants.MCAST_TTL); 
        client.addMembership(constants.MCAST_ADDR);
    });

    client.on('message', function (message, remote) {   
        console.log('MCast Msg: From: ' + remote.address + ':' + remote.port +' - ' + message);
        const err = TelemetryMessage.verify(message);
        if (err){
            console.log('SERVER:: Message err:' + err);
        }
        else{
            console.log('SERVER:: Message OK');
        }
        const metryMessage = TelemetryMessage.decode(message);
        console.log('SERVER::ant id: ' + metryMessage.id + 
                            ',x='+metryMessage.x + ',y=' + metryMessage.y + 
                            ',angle=' + metryMessage.angle + ',ll='+metryMessage.ll + 
                            ',ul=' + metryMessage.ul + ',bl=' + metryMessage.bl + ',rl='+metryMessage.rl);
        emiter.emit('ant-move-data', metryMessage);
    });
 
    client.bind(constants.MCAST_PORT)
};