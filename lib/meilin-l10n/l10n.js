var config,
    translations,
    logger = require('log4js').getLogger('l10n');

/**
 * Logs an event and throws an exception with it
 * @params any
 */
function fail(){
    var str = Array.prototype.join.call(arguments, ' ');
    logger.fatal(str);
    throw new Error(str);
}

var l10n = {
    configure: function(configname){
        config = require('meilin-resolve-config')(configname);
        var rootDir = config.rootDir;
        config = config.l10n;
        
        if(!config){
            throw new Error('No config for l10n');
        }
        
        var PATH = require('path'),
            path = PATH.resolve(rootDir, config.path);
        
        translations = require(path);
        if(config.needConvert){
            translations = this.convertTranslations(data);
        }
    },
    convertTranslations: function(data){
        var langs = config.langs,
            res = {};
        langs.forEach(function(lang){
            res[lang] = {};
        });
        
        function doConvert(data, keystring){
            var isEnd = langs.some(function(lang){
                return lang in data;
            });
            
            if(isEnd){
                langs.forEach(function(lang){
                    res[lang][keystring] = data[lang] || '';
                });
            }else{
                for(var key in data){
                    doConvert(data[key], keystring? (keystring + '.' + key):key);
                }
            }
        }
        doConvert(data);

        return res;
    },
    getInstance: function(src){
        if(!src){
            fail('getInstance on empty source');
        }
        if(!translations){
            fail('You must "configure" l10n beforehand');
        }
        var lang = this.detectLang(src),
            translation = translations[lang] || {};
        return {
            get: function(keypath){
                return translation[keypath] || '';
            },
            getLang: function(){
                return lang;
            }
        }
    },
    detectLang: function(src){
        /* проверка accept-language, домена и других источников смотря по тому, что передали и что в конфиге */
        return config.langs[0];
    },
    getTranslations: function(){
        return translations;
    }
};
module.exports = l10n;