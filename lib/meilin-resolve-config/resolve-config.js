var fs = require('fs'),
    path = require('path'),
    logger = require('log4js').getLogger('resolve-config'),
    configs = {};
module.exports = function getConfig(name){
    if(!name){
        name = 'meilin-config.json';
    }
    name = normalize(name);
    if(name in configs){
        return configs[name];
    }
    return configs[name] = findConfig(name, path.resolve('.'));
}
function normalize(name){
    if(name.lastIndexOf('.json') === -1){
        name += '.json';
    }
    if(name.indexOf('/') === 0){
        return name.substr(1);
    }
    return name;
}

/**
 * 
 * @param name {String} config name
 * @param dir {String} absolute path 
 * @returns {Object} config
 */
function findConfig(name, dir){
    var p = path.join(dir, name);
    logger.info('trying ' + p);
    if(fs.existsSync(p)){
        var config = require(p);
        if(!('rootDir' in config)){
            config.rootDir = path.dirname(p);
            logger.info('Set root for "' + name + '":' + config.rootDir);
        }
        return config;
    }
    if(dir !== '/'){
        return findConfig(name, path.resolve(dir, '..'));
    }else{
        throw new Error('Failed to load config file \'' + name + '\'');
    }
}
