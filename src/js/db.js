const loki = require("lokijs");
const lfsa = require('../3rd/loki-fs-structured-adapter');

const constants = require('./constants');
const emiter = require('./emiter');

const adapter = new lfsa();
var ldb;
var tool_data;
var sessions;

exports.databaseInitialize = (done) => {
    console.log('Initializing the lokijs DB');

    ldb = new loki(constants.DATABASE_LOCATION, { 
        adapter : adapter,
        autoload: true,
        autosave: true, 
        autosaveInterval: constants.DATABASE_AUTOSAVE_MS,
        autoloadCallback: function(){
            let log = ldb.getCollection("log");
            let maxSession = 1;

            if (log == null){
                console.log('Creating a new database');
                log = ldb.addCollection("log");
                tool_data = ldb.addCollection("tool_data");
                sessions = ldb.addCollection("sessions");
                sessions.insert({ session : maxSession});
            }
            else{
                console.log('database loaded');
                tool_data = ldb.getCollection("tool_data");
                sessions = ldb.getCollection("sessions");
                maxSession = sessions.chain().simplesort('session', true).data()[0].session;
                maxSession++;
                sessions.insert({ session : maxSession});
                console.log('total tool records:' + tool_data.count());
            }

            log.insert({ event: 'dbinit', dt: (new Date()).getTime(), message: 'DB loaded' });
            ldb.saveDatabase();   
            emiter.emit('db-init', maxSession); 
        }
    });
};

let toolKey = 0;
exports.insertToolRecord = (session, data) => {
    toolKey++;
    tool_data = ldb.getCollection("tool_data");
    tool_data.insert({
        key: toolKey,
        session: session,
        id: data.id, 
        x: data.x, 
        y: data.y, 
        angle: data.angle, 
        ll:data.ll, 
        ul:data.ul, 
        rl:data.rl, 
        bl:data.bl,
        battery:data.battery,
        type: data.type,
        tm: (new Date()).getTime()
    });
};

exports.basicInit = () => {
    ldb = new loki(constants.DATABASE_LOCATION, { 
        adapter : adapter,
        autoload: true,
        autosave: true, 
        autosaveInterval: constants.DATABASE_AUTOSAVE_MS,
        autoloadCallback: function(){
            emiter.emit('basicInit-ready'); 
        }
    });
};

exports.getToolData = (inSession, inId, lastKey) => {
    console.log('Get tool data for {' + inSession + ", " + inId + ", " + lastKey + "}");
    ldb.loadDatabase({}, _ => {
        tool_data = ldb.getCollection("tool_data");
        let result = tool_data.chain().find({'session': parseInt(inSession, 10), 'id': parseInt(inId, 10), 'key' : {'$gt': parseInt(lastKey, 10)}}).simplesort('tm').data();
        emiter.emit('toolData-ready', result); 
    });
};

exports.getToolList = (inSession) => {
    console.log('Get tool list for {' + inSession + "}");
    ldb.loadDatabase({}, _ => {
        tool_data = ldb.getCollection("tool_data");
        let toolData = tool_data.chain().find({'session': parseInt(inSession, 10)}).data();

        let result = [];
        for(let i = 0; i < toolData.length; i++){
            if(!result.includes(toolData[i].id)){
                result.push(toolData[i].id);
            }
        }

        emiter.emit('toolList-ready', result); 
    });
};

exports.storeUiCommand = (inSession, inCommand, inX, inY) => {
    console.log('Store tool command for {' + inSession + ", " + inCommand + "}");
    ldb.loadDatabase({}, _ => {
        let ui_commands = ldb.getCollection("ui_commands");
        if(ui_commands == null){
            ui_commands = ldb.addCollection("ui_commands");
        }
        ui_commands.insert({  session: inSession, command: inCommand, x: inX, y: inY, dt: (new Date()).getTime() });
        ldb.saveDatabase();   
    });
};

exports.getAllToolData = (inSession) => {
    console.log('Get all tool data for {' + inSession + "}");
    ldb.loadDatabase({}, _ => {
        tool_data = ldb.getCollection("tool_data");
        let result = tool_data.chain().find({'session': parseInt(inSession, 10)}).simplesort('tm').data();
        emiter.emit('allToolData-ready', result); 
    });
};

exports.getUiCommandsData = (inSession) => {
    console.log('Get all UI commands data for {' + inSession + "}");
    ldb.loadDatabase({}, _ => {
        ui_commands = ldb.getCollection("ui_commands");
        let result = ui_commands.chain().find({'session': parseInt(inSession, 10)}).simplesort('tm').data();
        emiter.emit('getUiCommandsData-ready', result); 
    });
};