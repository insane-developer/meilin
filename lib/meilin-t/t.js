var storage = {};


function BEMEntity(id){
    this.id = id;
    this.mods = {};
    this.templates = [];
    this.counter = 0;
};

BEMEntity.prototype = {
    add: function(modName, modVal, func){
        var place;
        if(modName){
            var p = this.mods[modName];
            if(!p){
                p = this.mods[modName] = {};
            }
            place = p[modVal || ''];
            if(!place){
                place = p[modVal || ''] = [];
            }
        }else{
            place = this.templates;
        }
        place.push({
            order: this.counter++,
            func: func
        });
    },
    _sortFunc: function(a,b){
        if(a.order < b.order){
            return -1;
        }else if(a.order > b.order){
            return 1;
        }
        return 0;
    },
    getSortedTemplates: function(bem){
        var matched = [],
            i,
            p = this.templates,
            l = p.length,
            mods = bem.mods || (bem._parent && bem._parent.mods);
        for(i = 0; i < l; i++){
            matched[i] = p[i];
        }
        if(mods){
            for(var modName in mods){
                p = this.mods[modName];
                if(p){
                    /* get modVal */
                    p = p[mods[modName] || ''];
                    if(p){
                        for(i = 0, l = p.length; i < l; i++){
                            matched.push(p[i]);
                        }
                    }
                }
            }
        }
        matched.sort(this._sortFunc);
        var res = [];
        for(i = 0, l = matched.length; i < l; i++){
            res[i] = matched[i].func;
        }
        return res;
    }
};

function Storage(namespace){
    var self = this;
    this.namespace = namespace;
    this.rebindFunctions();
    this.bem = new BEMStorage(this);
    this.views = Object.create(this.bem.templates);
}

function BEMStorage(instance){
    var bem = this;
    this.items = [];
    this.templates = {
        bemjson: function(bemjson){
            var argc = arguments.length,
                view = arguments[argc-1];
            if(bemjson instanceof Array){
                var str = [],
                    list = bemjson;
                
                for(var i = 0, l = bemjson.length; i < l; i++){
                    bemjson = list[i];
                    bem.expand(bemjson, list);

                    str[i] = bem.templates.bemjson.apply(this, arguments);
                }
                
                return str.join('');
            }
            if(bemjson instanceof Object){
                var parent = bemjson._parent;
    
                var id = bemjson.block,
                    res = bemjson;
                if(bemjson.elem){
                    if(!id){
                        id = parent.block;
                    }
                    id += bem.elemDelimiter + bemjson.elem;
                }
                if(bem.items && id){
                    var templates = bem.getEntityStorage(id).getSortedTemplates(bemjson);
                    for(var i = 0, l = templates.length; i < l; i++){
                        res = templates[i].apply(this, arguments);
                        if(res instanceof Object){
                            bemjson = res;
                        }else if(typeof res === 'string'){
                            return res;
                        }
                    }
                }
                return bem.templates.stringify.apply(this, arguments);
            }
            return bemjson;
        },
        /**
         * @param bemjson {Object}
         * @returns {String} html
         */
        stringify: function(bemjson){
            var argc = arguments.length,
                view = arguments[argc-1],
                tag = bemjson.tag || 'div',
                classnames = bem.buildBEMClassnames(bemjson, bemjson._block),
                attrs = bem.buildAttrs(bemjson.attrs||{});
                str = '<' + tag;
            if(classnames){
                str += ' class="' + classnames + '"';
            }
            str += attrs;
            str += '>'; 
            if(bemjson.content){
                if(bemjson.content instanceof Object){
                    bem.expand(bemjson.content, bemjson);
                    bemjson = bemjson.content;
                    str += bem.templates.bemjson.apply(this, arguments);
                }else{
                    str += bemjson.content;
                }
            }
            str += '</' + tag + '>';
            return str;
        }
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
    }
}

var bemProto = BEMStorage.prototype = {
    configure: function(params){
        if(params.elemDelimiter){
            this.elemDelimiter = params.elemDelimiter;
        }
        if(params.modDelimiter){
            this.modNameDelimiter = this.modValDelimiter = params.modDelimiter;
        }
        if(params.modValueDelimiter){
            this.modValDelimiter = params.modValueDelimiter;
        }
        if(params.jsInitClassname){
            this.initClassname = params.jsInitClassname;
        }
        this.entityRe = new RegExp('^([^\s]+?)' +
            '(?:' + this.elemDelimiter.replace(/([+\-\[\]\(\)\^\$*\.\/\\])/g, '\\\1') + '([^\s]+?))?' +
            '(?:' + this.modNameDelimiter.replace(/([+\-\[\]\(\)\^\$*\.\/\\])/g, '\\\1') + '([^\s]+?)' +
            '(?:' + this.modValDelimiter.replace(/([+\-\[\]\(\)\^\$*\.\/\\])/g, '\\\1') + '([^\s]+?))?)?$');
    },
    elemDelimiter: '__',
    modNameDelimiter: '_',
    modValDelimiter: '_',
    initClassname: 'i-bem',
    entityRe: /^([^\s]+?)(?:__(.+?))?(?:_(.+?)(?:_(.+?))?)?$/,
    /**
     * @description converts string representation of a bem entity to object representation
     * @param id {String} block[__elem][_modName[_modVal]]
     * @returns {Object} {block:'...'[, elem:'...'][, modName:'...'[, modVal:'...']]}
     */
    buildBEMEntity: function(id){
        var match = id.match(this.entityRe),
            bem = {};
        if(!match){
            throw new TypeError('Not a BEM entity id "' + id + '"');
        }
        bem.id = match[1] + (match[2]? this.elemDelimiter + match[2]:'');
        if(match[3]){
            bem.modName = match[3];
        }
        if(match[4]){
            bem.modVal = match[4];
        }
        return bem;
    },
    /**
     * @description builds all classnames for this block/element, including all modifiers,
     * mixed blocks and js-init class, if needed.
     * @param {Object} data bemjson which describes BEM block or element
     * @param {String} missingBlockName block name to be used if it is missing in the data or mix objects
     * @returns {String} classnames, space separated
     */
    buildBEMClassnames: function(data, missingBlockName){
        if(!(data instanceof Object)){
            return data;
        }
        if(!data.block && !data.elem && !data.mods){
            return '';
        }
        var entity = data.block || (data._parent && data._parent.block) || missingBlockName,
            str = [],
            mods = data.mods || {};
        if(data.elem){
            entity += this.elemDelimiter + data.elem;
        }
        str.push(entity);
        for(var modName in mods){
            if(mods.hasOwnProperty(modName)){
                if(mods[modName]){
                    str.push(entity + this.modNameDelimiter + modName + this.modValDelimiter + mods[modName]);
                }
            }
        }
        if(data.mix){
            var mix = this._2array(data.mix);
            for(var i = 0, l = mix.length; i < l; i++){
                var mixclasses = this.buildBEMClassnames(mix[i],
                    (data._parent && data._parent.block) || missingBlockName || data.block);
                if(mixclasses){
                    str.push(mixclasses);
                }
            }
        }
        if(!data.elem && data.js && (!data.mix || !data.mix.js)){
            str.push(this.initClassname);
        }
        return str.join(' ');
    },
    /**
     * @param data {Object} name-value map of attributes
     * @returns {String} 'name="value"' string space separated with leading space
     */
    buildAttrs: function(data){
        var str = '';
        for(var name in data){
            if(data[name]){
                str += ' ' + name + '="' + data[name] + '"';
            }
        }
        return str;
    },
    getEntityStorage: function(id){
        var s = this.items[id];
        if(!s){
            s = this.items[id] = new BEMEntity(id);
        }
        return s;
    },
    expand: function(current, prev){
        var parent = current._parent;
        if(!current.block){
            if(prev.block){
                parent = prev;
            }else if(prev._parent){
                parent = prev._parent;
            }
        }else{
            parent = current;
        }
        current._parent = parent;
    },
    addEntity: function(name, func){
        var bem = this.buildBEMEntity(name),
            entity = this.getEntityStorage(bem.id);
        entity.add(bem.modName, bem.modVal, func);
    },
    init: function(instance){
        
    },
    /**
     * @description transform an argument to an array. if the argument is already an array, does noting.
     * @param {any} collection any type
     * @returns {Array}
     */
    _2array: function(collection){
        if(collection instanceof Array){
            return collection;
        }
        return [collection];
    }
};

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