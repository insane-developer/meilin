var storage = {};

function Storage(namespace){
    this.namespace = namespace;
    this.items = {};
}

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
            l = p.length;
        for(i = 0; i < l; i++){
            matched[i] = p[i];
        }
        if(bem.mods){
            for(var modName in bem.mods){
                p = this.mods[modName];
                if(p){
                    /* get modVal */
                    p = p[bem.mods[modName] || ''];
                    if(p){
                        for(i = 0, l = p.length; i < l; i++){
                            matched.push(p[i]);
                        }
                    }
                }
            }
        }
        matched.sort(_sortFunc);
        var res = [];
        for(i = 0, l = matched.length; i < l; i++){
            res[i] = matched[i].func;
        }
        return res;
    }
};

var proto = Storage.prototype = {
    configure: function(params){
        if(!params){
            throw new Error('No params for bem');
        }
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
        var entity = data.block || missingBlockName,
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
                var mixclasses = this.buildBEMClassnames(mix[i], missingBlockName || data.block);
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
    generator: function(name, func){
        var bem = this.buildBEMEntity(name),
            entity = this.getEntityStorage(bem.id);
        entity.add(bem.modName, bem.modVal, func);
    },
    view: function(bemjson, parent){
        if(bemjson instanceof Array){
            var str = [];
            for(var i = 0, l = bemjson.length; i < l; i++){
                str[i] = this.view(bemjson[i], parent);
            }
            return str.join('');
        }
        if(bemjson instanceof Object){
            bemjson._block = bemjson.block || parent && (parent.block || parent._block);

            var id = bemjson.block || bemjson._block,
                res = bemjson;
            if(bemjson.elem){
                id += this.elemDelimiter + bemjson.elem;
            }
            if(this.items && id){
                var templates = this.getEntityStorage(id).getSortedTemplates(bemjson);
                for(var i = 0, l = templates.length; i < l; i++){
                    res = templates[i](bemjson);
                    if(res instanceof Object){
                        bemjson = res;
                    }else if(typeof res === 'string'){
                        return res;
                    }
                }
            }
            return this.stringify(res);
        }
        return bemjson;
    },
    /**
     * @param bemjson {Object}
     * @returns {String} html
     */
    stringify: function(bemjson){
        var tag = bemjson.tag || 'div',
            classnames = this.buildBEMClassnames(bemjson, bemjson._block),
            attrs = this.buildAttrs(bemjson.attrs||{});
            str = '<' + tag;
        if(classnames){
            str += ' class="' + classnames + '"';
        }
        str += attrs;
        str += '>'; 
        if(bemjson.content){
            if(bemjson.content instanceof Object){
                str += this.view(bemjson.content, bemjson);
            }else{
                str += bemjson.content;
            }
        }
        str += '</' + tag + '>';
        return str;
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
    configure: proto.configure.bind(proto),
    buildBEMClassnames:proto.buildBEMClassnames.bind(proto),
    buildBEMEntity: proto.buildBEMEntity.bind(proto),
    stringify: proto.stringify.bind(proto),
    getGenerator: function(namespace){
        if(!namespace){
            namespace = 'default';
        }
        if(!(namespace in storage)){
            storage[namespace] = new Storage(namespace);
        }
        
        return storage[namespace].generator;
    },
    getTemplates: function(namespace){
        if(!namespace){
            namespace = 'default';
        }
        var ns = storage[namespace];
        if(!ns){
            if(namespace === 'default'){
                ns = storage[namespace] = new Storage(namespace);
                return ns;
            }
            throw new Error('No namespace "' + namespace + '"');
        }
        return ns.view;
    }
};