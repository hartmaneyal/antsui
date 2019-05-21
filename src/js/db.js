const loki = require("lokijs");
const lfsa = require('../3rd/loki-fs-structured-adapter');

const constants = require('./constants');

const adapter = new lfsa();
var ldb;
var tool_data;

exports.databaseInitialize = () => {
    console.log('Initializing the lokijs DB');

    ldb = new loki(constants.DATABASE_LOCATION, { 
        adapter : adapter,
        autoload: true,
        autosave: true, 
        autosaveInterval: constants.DATABASE_AUTOSAVE_MS,
        autoloadCallback: function(){
            let log = ldb.getCollection("log");

            if (log == null){
                console.log('Creating a new database');
                log = ldb.addCollection("log");
                tool_data = ldb.addCollection("tool_data");
                ldb.saveDatabase();
            }
            else{
                console.log('database loaded');
                tool_data = ldb.getCollection("tool_data");
                console.log('total tool records:' + tool_data.count());
            }

            log.insert({ event: 'dbinit', dt: (new Date()).getTime(), message: 'DB loaded' });
        }
    });
};

exports.insertToolRecord = (data) => {
    tool_data = ldb.getCollection("tool_data");
    tool_data.insert({
        id: data.id, 
        x: data.x, 
        y: data.y, 
        angle: data.angle, 
        ll:data.ll, 
        ul:data.ul, 
        rl:data.rl, 
        bl:data.bl,
        tm: (new Date()).getTime()
    });
};