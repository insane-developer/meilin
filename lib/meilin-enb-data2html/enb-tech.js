var Vow = require('vow'),
    vowFs = require('vow-fs'),
    PATH = require('path'),
    t = require('meilin-t');

module.exports = require('enb/lib/build-flow').create()
    .name('meilin-enb-data2html')
    .target('target', '?.html')
    .useSourceFilename('src', '?.data.js')
    .useSourceFilename('tmpl', '?.t.js')
    .defineRequiredOption('rootTemplate')
    .builder(function(src, tmpl){
        var node = this.node,
            templateName = this.getOption('rootTemplate');
        return Vow.all({src:src, tmpl:tmpl}).then(function(data) {
            require(data.tmpl);
            var src = require(data.src),
                v = t.getView(node.getTargetName());
            return v(templateName, src);
        });
    })
    .createTech(); 