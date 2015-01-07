module.exports = {
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
    },
    elemDelimiter: '__',
    modNameDelimiter: '_',
    modValDelimiter: '_',
    initClassname: 'i-bem',
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
        if(!data.elem && (data.js)){
            str.push(this.initClassname);
        }
        return str.join(' ');
    },
    buildBEMjsParams: function(data){
        
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