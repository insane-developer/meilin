var vow = require('vow'),
    vowFs = require('vow-fs'),
    PATH = require('path');

module.exports = require('enb/lib/build-flow').create()
    .name('meilin-enb-tech') // Выбираем имя для технологии
    .target('target', '?.t.js') // Имя опции для задания имени результирующего файла и значение по умолчанию
    .defineRequiredOption('origin')
    .defineOption('levelToNamespace')
    .defineOption('root')
    .useFileList('t.js') // Указываем, какие суффиксы нас интересуют при сборке
    .builder(function(sources){
        var node = this.node,
            level2namespace = this.getOption('levelToNamespace') || {},
            root = this.getOption('root') || '.';
        
        return Vow.all(jsFiles.map(function(file) {
            console.log(file);
            var level = PATH.resolve(root, PATH.dirname(file));
            
            if(level in level2namespace){
                level = level2namespace[level];
            }
            return vowFs.read(file.fullname, 'utf8').then(function(data) {
                var filename = node.relativePath(file.fullname);
                return JSON.stringify({ filename: filename, ns: level });
            });
        })).then(function(contents) {
            return contents.join(',\n');
        });
    })
    .createTech(); 