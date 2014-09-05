var fs = require('fs'),
    PATH = require('path'),
    logger = require('log4js').getLogger('config'),
    itIsNotAModule = {
        rootDir: true
    };

module.exports = {
    getConfig: function(path){
        path = normalize(path);
        return recursiveFind(path, PATH.resolve('.'));
    },
    configureAll: function(path){
        var config = this.getConfig(path);
        
        for(var module in config){
            this.configureModule(module, config[module], config);
        }
    },
    configureModule: function(moduleName, data, config){
        if(moduleName in itIsNotAModule){
            logger.info('Skipping not-a-module "' + moduleName + '"');
            return;
        }
        var module = require(moduleName);
        if(module.configure && typeof module.configure === 'function'){
            module.configure(data, config.rootDir, config);
            logger.info('Module "' + moduleName + '" configured');
        }else{
            logger.warn('Module "' + moduleName + '" doesn\'t have configure method. Skipping');
        }
    },
    ignoreModule: function(name){
        if(name){
            itIsNotAModule[name] = true;
        }
    }
}

function normalize(path){
    if(!path){
        path = 'meilin.json';
    }
    if(path.lastIndexOf('.json') === -1){
        path += '.json';
    }

    return path;
}

/**
 * 
 * @param name {String} config name
 * @param dir {String} absolute path 
 * @returns {Object} config
 */
function recursiveFind(name, dir){
    var p = PATH.join(dir, name);
    logger.info('trying ' + p);
    if(fs.existsSync(p)){
        var config = require(p);
        if(!('rootDir' in config)){
            config.rootDir = PATH.dirname(p);
            logger.info('Set root for "' + name + '":' + config.rootDir);
        }
        return config;
    }
    if(dir !== '/'){
        return recursiveFind(name, PATH.resolve(dir, '..'));
    }else{
        throw new Error('Failed to load config file \'' + name + '\'');
    }
}
