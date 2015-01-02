var storage = {};

function Storage(namespace, parent){
    var self = this;
    this.namespace = namespace;
    this.rebindFunctions();
    if(parent && parent.views){
        this.views = Object.create(parent.views);
    }else{
        this.views = {};
    }
    
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
        /* preparing arguments to be used in apply of call of template.
         * Last argument here is a context, first - view's name */
        arguments[0] = arguments[last];
        /* last arg must be the view func */
        arguments[last] = this.view;
        if(this.views[name]){
            return Function.prototype.call.apply(this.views[name], arguments);
        }
        throw new Error('Undefined view "' + name + '" in namespace "' + this.namespace + '"');
    },
    makeTemplateFromString: function(str){
        var tmpls = this.views,
            pattern = /([\s\S]*?)\[%\s+([^\s%]+)\s+%\]/g,
            tokens = [],
            isStrings = [];
        
        tokens.push(str.replace(pattern, function(match, before, group){
            if(before){
                tokens.push(before);
                isStrings.push(true);
            }
            if(group){
                tokens.push(group);
                isStrings.push(false);
            }
            /* We need to return nothing because we will
             * push the rest of unmatched string to the tokens array. */
            return '';
        }));
        isStrings.push(true);
        
        return function concatTokens(data){
            var args = arguments,
                argc = args.length,
                token,
                isString,
                str = '';
            for(var i = 0, l = tokens.length; i < l; i++){
                token = tokens[i];
                isString = isStrings[i];
                if(isString){
                    str += token;
                }else if(argc > 1 && data && data[token] !== undefined){
                    str += data[token];
                }else {
                    var nextTmpl = tmpls[token];
                    if(nextTmpl && nextTmpl.apply &&
                        (args !== args || nextTmpl !== args.callee)){
                        str += nextTmpl.apply(this, args);
                    }
                }
            }
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
    getGenerator: function(namespace, parentNamespace){
        if(!namespace){
            namespace = 'default';
        }
        if(!(namespace in storage)){
            storage[namespace] = new Storage(namespace, parentNamespace && storage[parentNamespace]);
        }
        
        return storage[namespace].generator;
    },
    getView: function(namespace){
        if(!namespace){
            namespace = 'default';
        }
        var ns = storage[namespace],
            self = this;
        if(!ns){
            throw new Error('No namespace "' + namespace + '"');
        }
        return ns.view;
    }
}