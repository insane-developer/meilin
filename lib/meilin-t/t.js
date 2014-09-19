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
    view: function(){
        var last = arguments.length - 1,
            name = arguments[0];
        /* preparing arguments to be used in apply of call of template */
        arguments[0] = arguments[last];
        /* last arg must be the view func */
        arguments[last] = this.view;
        if(this.views[name]){
            return Function.prototype.call.apply(this.views[name], arguments);
        }
        throw new Error('Undefined view "' + name + '" in namespace "' + this.namespace + '"');
    },
    getNamespace: function(){
        return this.views;
    },
    makeTemplateFromString: function(str){
        var namespace = this, 
            tmpls = this.views;
        return function(data){
            var self = this,
                selfArgs = arguments;
            return str.replace(/\[%\s+([^\s%]+)\s+%\]/g, function(match, group){
                if(data && data !== namespace.view && data[group] !== undefined){
                    return data[group];
                }
                var nextTmpl = tmpls[group];
                /* nextTmpl exists, is function, and is not the same or going to be called with different args
                 * TODO: left selfArgs should be replaced by smth else */
                if(nextTmpl && nextTmpl.apply &&
                    (selfArgs !== selfArgs || nextTmpl !== selfArgs.callee)){
                    return tmpls[group].apply(self, selfArgs);
                }
                return '';
            });
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
            /* preserve 'this' */
            Array.prototype.push.call(arguments, this);
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
            storage[namespace] = new Storage(namespace);
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