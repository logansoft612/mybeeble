var path = require('path'),
    rootPath = path.normalize(__dirname + '/..');

module.exports = {
    app : {
        name : "myBeeble",
        textbook_status : ["all", "new", "allow", "deny"],
        user_status : ["new", "active", "admin"]
    },
    db : {
        host         : '192.168.0.199',
        user         : 'mybeeble',
        password     : 'password',
        database     : 'mybeebledb',
        wait_timeout : 1000
    },
    root : rootPath,
    cover_path: '/mnt/mybeeble/books/imgs/',
    avatar_path: '/mnt/mybeeble/avatar/',
    port : 3000,
    curlPath: {
        zipInRadius : "http://zipcodedistanceapi.redline13.com/rest/cdVnHmC9UXF5ltFIm4Cff7aDO4Fn6Mzi0uGHRiQLgwRB0xkmBWBQ4LuSQ9gXVQfW/radius.json/71959/50/km"
    }
}

