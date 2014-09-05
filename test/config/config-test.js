var path = require('path');
test('config', function(){
    config.ignoreModule('name');
    var c = config.getConfig('config/a/b/c.json');
    equal(c.name, 'q', 'c ok');
    equal(c.rootDir, path.resolve('config/a/b'), 'c root ok');
    
    var d = config.getConfig('config/a/d.json');
    equal(d.name, 'w', 'd ok');
    equal(d.rootDir, '/etc/smth', 'd root ok');
    
    var msg;
    try{
        var e = config.getConfig('404.json');
    }catch(e){
        msg = e.message;
    }
    equal(msg, 'Failed to load config file \'404.json\'', '404 ok');
});