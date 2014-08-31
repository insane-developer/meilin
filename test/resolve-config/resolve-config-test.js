var path = require('path');
test('resolveConfig', function(){
    var c = resolveConfig('resolve-config/a/b/c.json');
    equal(c.name, 'q', 'c ok');
    equal(c.rootDir, path.resolve('resolve-config/a/b'), 'c root ok');
    
    var d = resolveConfig('resolve-config/a/d.json');
    equal(d.name, 'w', 'd ok');
    equal(d.rootDir, '/etc/smth', 'd root ok');
    
    var msg;
    try{
        var e = resolveConfig('404.json');
    }catch(e){
        msg = e.message;
    }
    equal(msg, 'Failed to load config file \'404.json\'', '404 ok');
});