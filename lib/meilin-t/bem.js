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
            res[l - i - 1] = matched[i].func;
        }
        return res;
    }
};

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
                        if(res instanceof Array){
                            bemjson = res;
                            return bem.templates.bemjson.apply(this, arguments);
                        }else if(res instanceof Object){
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

BEMStorage.prototype = {
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
        this.entityRe = new RegExp('^([^\\s]+?)' +
            '(?:' + this.elemDelimiter.replace(/([+\-\[\]\(\)\^\$*\.\/\\])/g, '\\\1') + '([^\\s]+?))?' +
            '(?:' + this.modNameDelimiter.replace(/([+\-\[\]\(\)\^\$*\.\/\\])/g, '\\\1') + '([^\\s]+?)' +
            '(?:' + this.modValDelimiter.replace(/([+\-\[\]\(\)\^\$*\.\/\\])/g, '\\\1') + '([^\\s]+?))?)?$');
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
    },
    copyTemplates: function copy(from){
        if(!(from instanceof BEMStorage)){
            throw new TypeError('Can copy templates only from BEMStorage instance');
        }
        for(var name in from.items){
            if(from.items.hasOwnProperty(name)){
                this.items[name] = from.items[name];
            }
        }
    }
};
module.exports = BEMStorage;