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
        var instance = this;

        this.view = function view(){
            var name = arguments[0],
                context = this;

            if(instance.views[name]){
                /* last arg must be the view func */
                Array.prototype.push.call(arguments, view);
                /*
                 * Don't not yet, if the view func passed in last arg should be bound to the context.
                 * Assume not for now because of flexibility. The code below changes this behavior:
                 * Array.prototype.push.call(arguments, function contextBoundView(){
                 *     return instance.view.apply(context, arguments);
                 * });
                 */

                /* First argument is a view name, and we should unshift arguments, but it would be too slow.
                 * Instead we put a context into the first arg and apply a call function to the view and arguments,
                 * and it will do the trick.
                 */
                arguments[0] = context;
                return Function.prototype.call.apply(instance.views[name], arguments);
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
    }
}