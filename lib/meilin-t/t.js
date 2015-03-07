var BEMStorage = require('./bem.js');
var storage = {};


function Storage(namespace, parentNamespace){
    var self = this;
    this.rebindFunctions();
    this.namespace = namespace;
    this.bem = new BEMStorage(this);
    this.views = Object.create(this.bem.templates);
    if(parentNamespace){
        if(typeof parentNamespace === 'string' && parentNamespace in storage){
            parentNamespace = storage[parentNamespace];
        }
        this.copyTemplates(parentNamespace);
    }
}

/** 
 * Private constructor.
 * No one outside can access its members.
 */
var proto = Storage.prototype = {
    configure: function(params){
        if(!params){
            throw new Error('No params for t');
        }
    },
    extensions: [],
    callExtension: function callExtension(context, tokens, args){
        var ns = this.extensions[tokens[0]],
            func = ns && ns[tokens[1]];
        if(!func){
            return '';
        }
        return func.call(context, tokens.slice(2), args, this.view);
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
        
        return function concatTokens(){
            var args = arguments,
                argc = args.length,
                data = args[0],
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
                    var d = data[token];
                    if(d instanceof Object){
                        arguments[0] = d;
                        str += instance.bem.templates.bemjson.apply(this, arguments);
                    }else{
                        str += data[token];
                    }
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
                /*
                 * Don't add a view function, if the last arg is already that function
                 */
                if(!newargs[i-2] || newargs[i-2].name !== 'contextBoundView'){
                    newargs[i-1] = function contextBoundView(){
                        return instance.view.apply(context, arguments);
                    };
                }
                return instance.views[name].apply(context, newargs);
            }
            throw new Error('Undefined view "' + name + '" in namespace "' + instance.namespace + '"');
        };
        this.generator = function generator(name, smth){
            var template;
            if(typeof smth === 'function'){
                template = instance.makeTemplateFromFunction(smth);
            }else{
                template = instance.makeTemplateFromString(smth);
            }
            instance.views[name] = template;
            instance.bem.addEntity(name, template)
        };
        
        this.generator.getView = function getView(){
            return instance.view;
        };
    },
    registerExtension: function registerExtension(name, extensionNamespace){
        if(this.extensions[name]){
            throw new Error('Extension "' + name + '" was already registered');
        }
        this.extensions[name] = extensionNamespace;
    },
    unregisterExtension: function unregisterExtension(name){
        if(!this.extensions[name]){
            throw new Error('No extension "' + name + '"');
        }
        this.extensions[name] = null;
    },
    copyTemplates: function copy(from){
        if(!(from instanceof Storage)){
            throw new TypeError('Can copy templates only from Storage instances');
        }

        for(var name in from.views){
            if(from.views.hasOwnProperty(name)){
                this.views[name] = from.views[name];
            }
        }
        this.bem.copyTemplates(from.bem);
    }
}

var bemProto = BEMStorage.prototype;

module.exports = {
    configure: function configureAll(params){
        proto.configure(params);
        if(params.bem){
            bemProto.configure(params.bem);
        }
    },
    getGenerator: function getGenerator(namespace, parentNamespace){
        if(!namespace){
            namespace = 'default';
        }
        if(!(namespace in storage)){
            storage[namespace] = new Storage(namespace, parentNamespace);
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
    registerExtension: function(name, extensionNamespace){
        proto.registerExtension(name, extensionNamespace);
    },
    unregisterExtension: function unregisterExtension(name){
        proto.unregisterExtension(name);
    },
    bem: {
        buildBEMClassnames: bemProto.buildBEMClassnames.bind(bemProto),
        buildBEMEntity: bemProto.buildBEMEntity.bind(bemProto)/*,
        stringify: proto.bem.stringify.bind(proto.bem)*/
    }
}