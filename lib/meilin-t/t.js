var storage = {};

function Storage(namespace){
    var self = this;
    this.namespace = namespace;
    this.rebindFunctions();
    this.views = {};
}
/** 
 * Private constructor. 
 * No one outside can access its members.
 */
Storage.prototype = {
    generator: function (name, smth){
        if(typeof smth === 'function'){
            this.views[name] = this.makeTemplateFromFunction(smth);
        }else{
            this.views[name] = this.makeTemplateFromString(smth);
        }
    },
    view: function(name, data){
        return this.views[name] && this.views[name](data); 
    },
    getNamespace: function(){
        return this.views;
    },
    makeTemplateFromString: function(str){
        return function(data){
            return str;
        }
    },
    makeTemplateFromFunction: function(func){
        return func;
    },
    rebindFunctions: function(){
        var self = this,
            g = this.generator,
            v = this.view;
        this.generator = function generatorProxy(){
            return g.apply(self, arguments);
        }
        this.view = function viewProxy(){
            return v.apply(self, arguments);
        };
        this.generator.getView = function(){
            return self.view;
        }
    }
}


module.exports = {
    getGeneratorForNamespace: function(namespace){
        if(!(namespace in storage)){
            storage[namespace] = new Storage();
        }
        
        return storage[namespace].generator;
    },
    getViewForNamespace: function(namespace){
        var ns = storage[namespace],
            self = this;
        if(!ns){
            throw new Error('No namespace "' + namespace + '"');
        }
        return ns.view;
    },
    getNamespace: function(name){
        return storage[name].getNamespace();
    }
}