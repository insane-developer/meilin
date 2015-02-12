var Vow = require('vow'),
    vowFs = require('vow-fs'),
    PATH = require('path');

module.exports = require('enb/lib/build-flow').create()
    .name('meilin-enb-tech') // Выбираем имя для технологии
    .target('target', '?.t.js') // Имя опции для задания имени результирующего файла и значение по умолчанию
    .defineOption('root')
    .useFileList('t.js') // Указываем, какие суффиксы нас интересуют при сборке
    .builder(function(sources){
        var node = this.node,
            root = this.getOption('root') || '.',
            notInNodejs = this.getOption('root');
        return Vow.all(sources.map(function(file) {
            //console.log(file);
            var level = PATH.resolve(root, PATH.dirname(file));
            
            return vowFs.read(file.fullname, 'utf8').then(function(data) {
                var filename = node.relativePath(file.fullname);
                return '/* begin: ' + filename + ' */\n' +
                    data +
                    '\n/* end: ' + filename + ' */\n';
            });
        })).then(function(contents) {
            return 'module.exports=(function(){\n'+
                'var t = require(\'meilin-t\').getGenerator(\'' + node.getTargetName() + '\');\n'+
                    contents.join('') +
                ';\nreturn t.getView();\n'+
            '})()';
        });
    })
    .createTech(); 