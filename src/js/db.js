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

exports.insertToolRecord = (session, data) => {
    tool_data = ldb.getCollection("tool_data");
    tool_data.insert({
        session: session,
        id: data.id, 
        x: data.x, 
        y: data.y, 
        angle: data.angle, 
        ll:data.ll, 
        ul:data.ul, 
        rl:data.rl, 
        bl:data.bl,
        battery: data.battery,
        tm: (new Date()).getTime()
    });
};

exports.getToolData = (session, id) => {
    ldb = new loki(constants.DATABASE_LOCATION, { 
        adapter : adapter,
        autoload: true,
        autosave: true, 
        autosaveInterval: constants.DATABASE_AUTOSAVE_MS,
        autoloadCallback: function(){
            tool_data = ldb.getCollection("tool_data");
            let result = tool_data.find({'session':1, 'id': 1});
            emiter.emit('tool-data-ready', result); 
        }
    });
}