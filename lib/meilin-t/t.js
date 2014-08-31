var storage = {};

function Storage(namespace){
    this.namespace = namespace;
    this.views = {};
}

Storage.prototype = {
    generator: function (name, str){
        this.views[name] = this.getTemplate(str);
    },
    view: function(name, data){
        return this[name] && this[name](data); 
    },
    getNamespace: function(){
        return this.views;
    },
    getTemplate: function(str){
        return function(data){
            str.replace(/\[%\s+([\w\d:\.]+)\s+%\]/ig, function(match, group){
                return data[group] || match;
            });
        }
    }
}


module.exports = {
    getGeneratorForNamespace: function(namespace){
        if(!(namespace in storage)){
            storage[namespace] = new Storage();
        }
        
        var obj = storage[namespace],
            proxy = function(){
                return obj.generator.apply(obj, arguments);
            };
    },
    getViewForNamespace: function(namespace){
        var ns = storage[namespace],
            self = this;
        if(!ns){
            throw new Error('No namespace "'+namespace+'"');
        }
        return function(name, data){
            return ns[name] && ns[name](data); 
        };
    },
    getNamespace: function(name){
        return storage[name].views;
    }
}