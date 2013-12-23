var path = require('path'),
    rootPath = path.normalize(__dirname + '/..');

module.exports = {
  app : {
    name : "myBeeble"
  },
  db : {
    host         : '192.168.0.199',
    user         : 'mybeeble',
    password     : 'password',
    database     : 'mybeebledb',
    wait_timeout : 1000
  },
  root : rootPath,
//  cover_path: rootPath + '/public/covers',
//  avatar_path: rootPath + '/public/avatar',
  port : 3000,
  curlPath: {
      zipInRadius : "http://zipcodedistanceapi.redline13.com/rest/cdVnHmC9UXF5ltFIm4Cff7aDO4Fn6Mzi0uGHRiQLgwRB0xkmBWBQ4LuSQ9gXVQfW/radius.json/71959/50/km"
  }
}

