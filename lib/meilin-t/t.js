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
var proto = Storage.prototype = {
    extensions: [],
    callExtension: function callExtension(context, tokens, args){
        if(this.extensions[tokens[0]]){
            return this.extensions[tokens[0]].call(context, tokens.slice(1), args, this.view);
        }
        return '';
    },
    makeTemplateFromString: function(str){
        var instance = this,
            tmpls = this.views,
            pattern = /([\s\S]*?)\[%\s+([^\s%]+)\s+%\]/g,
            tokens = [],
            types = [];
        
        tokens.push(str.replace(pattern, function(match, before, group){
            if(before){
                tokens.push(before);
                types.push(1);
            }
            if(group){
                var parts = group.split(':');
                if(parts.length > 1){
                    /* this is an extension call */
                    tokens.push(parts);
                    types.push(2);
                }else{
                    tokens.push(group);
                    types.push(0);
                }
            }
            /* We need to return nothing because we will
             * push the rest of unmatched string to the tokens array. */
            return '';
        }));
        types.push(1);
        
        return function concatTokens(data){
            var args = arguments,
                argc = args.length,
                token,
                type,
                str = '';
            for(var i = 0, l = tokens.length; i < l; i++){
                token = tokens[i];
                type = types[i];
                if(type === 1){
                    str += token;
                }else if(type === 2){
                    /* extension call */
                    str += instance.callExtension(this, token, Array.prototype.slice.call(args, 0, -1));
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
        var instance = this;

        this.view = function view(){
            var name = arguments[0],
                context = this;

            if(name.indexOf(':') !== -1){
                /* This is an extension call */
                var tokens = name.split(':');
                return instance.callExtension(context, tokens, Array.prototype.slice.call(arguments, 1));
            }else if(instance.views[name]){
               /* First argument is a view name, and we should shift arguments, but it would be too slow.
                * Instead we put a context into the first arg and apply a call function to the view and arguments,
                * and it will do the trick.
                * 
                * arguments[0] = context;
                * return Function.prototype.call.apply(instance.views[name], arguments);
                * 
                * Stupid copy-paste is faster, than call.apply, if we need to push smth into arguments:
                * http://jsperf.com/call-apply-vs-shift
                */

                var newargs = [];
                for(var i = 1, l = arguments.length; i < l; i++){
                   newargs[i-1] = arguments[i];
                }
                newargs[i-1] = view;
                /*
                 * Don't know yet, if the view func passed in last arg should be bound to the context.
                 * Assume not for now because of flexibility. The code below changes this behavior:
                 * newargs[i-1] = function contextBoundView(){
                 *     return instance.view.apply(context, arguments);
                 * };
                 */
                return instance.views[name].apply(context, newargs);
            }
            throw new Error('Undefined view "' + name + '" in namespace "' + instance.namespace + '"');
        };
        
        this.generator = function generator(name, smth){
            if(typeof smth === 'function'){
                instance.views[name] = instance.makeTemplateFromFunction(smth);
            }else{
                instance.views[name] = instance.makeTemplateFromString(smth);
            }
        };
        
        this.generator.getView = function getView(){
            return instance.view;
        };
    },
    registerExtension: function registerExtension(name, func){
        if(this.extensions[name]){
            throw new Error('Extension "' + name + '" was already registered');
        }
        this.extensions[name] = func;
    },
    unregisterExtension: function unregisterExtension(name){
        if(!this.extensions[name]){
            throw new Error('No extension "' + name + '"');
        }
        this.extensions[name] = null;
    }
}


module.exports = {
    getGenerator: function getGenerator(namespace, parentNamespace){
        if(!namespace){
            namespace = 'default';
        }
        if(!(namespace in storage)){
            storage[namespace] = new Storage(namespace, parentNamespace && storage[parentNamespace]);
        }
        
        return storage[namespace].generator;
    },
    getView: function getView(namespace){
        if(!namespace){
            namespace = 'default';
        }
        var ns = storage[namespace],
            self = this;
        if(!ns){
            throw new Error('No namespace "' + namespace + '"');
        }
        return ns.view;
    },
    registerExtension: function(name, func){
        proto.registerExtension(name, func);
    },
    unregisterExtension: function unregisterExtension(name){
        proto.unregisterExtension(name);
    }
}