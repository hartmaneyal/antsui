module.exports = {
    // App version
    APP_VERSION : 0.85,
    // Screen size
    MAIN_WINDOW_WIDTH : 1400,
    MAIN_WINDOW_HEIGHT : 1000,
    TOOL_WINDOW_WIDTH : 1000,
    TOOL_WINDOW_HEIGHT : 900,
    FEED_WINDOW_WIDTH : 1000,
    FEED_WINDOW_HEIGHT : 900,
    // Simulative data refresh rate
    SIMULATION_SPEED_MS : 500,
    // database setting
    DATABASE_LOCATION : './db/antsui.db',
    DATABASE_AUTOSAVE_MS : 1000,
    // NET Server settings
    SERVER_SOCKET_TIMEOUT : 6,
    SERVER_MAX_TOOLS : 10,
    SERVER_SOCKET_TIMEOUT_MS : 1000,
    SERVER_PORT : 1337,
    VIDEO_PORT: 1338,
    // Map grid
    MAP_WIDTH : 550, // was 740    gridContainer min-height: 380px; tblDivMain max-height 300px;
    MAP_HEIGHT : 550, // was 370
    MAP_X_LINES : 30, // was 50
    MAP_Y_LINES : 30,
    MAP_GRID_LINE_COLOR : '#5bcb6b',
    MAP_SPECIAL_LINE_COLOR : 'green',
    MAP_WALL_LINE_COLOR : 'purple',
    MAP_EXIT_LINE_COLOR : 'red',
    MAP_VISITED_CELL_COLOR : '#42965a',
    MAP_IRRELEVANT_CELL : '#5A4F4F',
    MAP_PRIORITY_CELL : '#2C4B9F',
    MAP_BLOCKED_CELL : '#B21F50',
    MAP_ENUM_WALL : 'wall',
    MAP_ENUM_ENTRY : 'entry',
    MAP_ENUM_EXIT : 'exit',
    MAP_ENUM_OPEN : 'open',
    MAP_ANIME_DURATION : 500,
    MAP_INVERT_Y : true,
    // feed definitions
    FEED_COLUMNS : 2, // must be an integer, divideable by 12
    //MCAST parameters
    MCAST_ADDR : "230.185.192.108",
    MCAST_HOST : '127.0.0.1',
    MCAST_PORT : 41848,
    MCAST_TTL : 128,
    MCAST_AUTO_START : false,
    // EXPORT
    EXPORT_FOLDER : './export',
    EXPORT_FILE_DATA : './export/data.json',
    EXPORT_FILE_COMMANDS : './export/commands.json',
    // Ant types
    ANT_SCOUT : 'scout',
    ANT_TRANSMISSION : 'trans',
    // Ant icons
    ANT_SCOUT_ICON : '../../images/drone.png',
    ANT_TRANSMISSION_ICON : '../../images/droneDown.png',
    // Transmission range
    ANT_TRANSMISSION_RANGE : 2,
    // Algorithm server
    ALGO_SERVER_IP : '10.0.0.1',
    ALGO_SERVER_PORT : 5000,
    // Algorithm server
    ANT_SERVER_IP : '10.51.128.52',
    ANT_SERVER_PORT : 3000,
    ANT_SPEED_MS : 1000,
}
