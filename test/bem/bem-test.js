test('configure', function(){
    bem.configure({
        elemDelimiter: '++',
        modDelimiter: '--',
        modValueDelimiter: '---',
        jsInitClassname: 'js-auto'
    });
    equal(bem.buildBEMClassnames({
        block: 'smth',
        mods: {
            size: 'big'
        },
        mix: {
            elem: 'hand'
        },
        js: true
    }), 'smth smth--size---big smth++hand js-auto', 'configure ok');
    bem.configure({
        elemDelimiter: '__',
        modDelimiter: '_',
        jsInitClassname: 'i-bem'
    });
});
/**
 * TODO: compare with bemhtml templater
 */
test('buildBEMClassnames', function(){
    var str = 'already_a_string';
    equal(bem.buildBEMClassnames(str), str, 'String');
    var block = {
            block: 'smth'
        },
        elem = {
            block: 'smth',
            elem: 'hand'
        },
        blockWmod0 = {
            block: 'smth',
            mods: {
                size: 'big',
                color: 'red'
            }
        },
        elemWmod0 = {
            block: 'smth',
            elem: 'hand',
            mods: {
                size: 'big',
                color: 'red'
            }
        },
        blockWmod1 = {
            block: 'smth',
            mods: {
                size: 'big',
                color: 'red'
            },
            js: true
        },
        elemWmod1 = {
            block: 'smth',
            elem: 'hand',
            mods: {
                size: 'big',
                color: 'red'
            },
            js: true
        },
        blockWmix0 = {
            block: 'smth',
            mix: 'mixclass'
        },
        blockWmix1 = {
            block: 'smth-other',
            mix: blockWmod1,
            js: true
        },
        incompleteElem = {
            elem: 'hand'
        },
        incompleteMix = {
            block: 'smth',
            mix: {
                elem: 'arrow'
            }
        };
    equal(bem.buildBEMClassnames(block), 'smth', 'block');
    equal(bem.buildBEMClassnames(elem), 'smth__hand', 'elem');
    equal(bem.buildBEMClassnames(blockWmod0), 'smth smth_size_big smth_color_red', 'blockWmod0');
    equal(bem.buildBEMClassnames(elemWmod0), 'smth__hand smth__hand_size_big smth__hand_color_red', 'elemWmod0');
    equal(bem.buildBEMClassnames(blockWmod1), 'smth smth_size_big smth_color_red i-bem', 'blockWmod1');
    equal(bem.buildBEMClassnames(elemWmod1), 'smth__hand smth__hand_size_big smth__hand_color_red', 'elemWmod1');
    equal(bem.buildBEMClassnames(blockWmix0), 'smth mixclass', 'blockWmix0');
    equal(bem.buildBEMClassnames(blockWmix1), 'smth-other smth smth_size_big smth_color_red i-bem', 'blockWmix0');
    equal(bem.buildBEMClassnames(incompleteElem, 'smth'), 'smth__hand', 'incompleteElem');
    equal(bem.buildBEMClassnames(incompleteMix, 'clock'), 'smth clock__arrow', 'incompleteMix');
});

test('buildBEMEntity', function(){
    var cases = {
        'block': { id: 'block' },
        'block__elem': { id: 'block__elem' },
        'block_mod_val': { id: 'block', modName: 'mod', modVal: 'val' },
        'block__elem_mod_val': { id: 'block__elem', modName: 'mod', modVal: 'val' }
    };
    for(var id in cases){
        var q = bem.buildBEMEntity(id),
            testbem = cases[id];
        for(var key in testbem){
            equal(q[key], testbem[key], id + ': ' + key);
        }
    }
});
var testjson = {
    block: 'block',
    mods: {
        size: 'big'
    },
    mix: {
        block: 'ee',
        js: true
    },
    js: true,
    content: [
        {
            elem: 'tree',
            content: 'bla'
        },
        {
            elem: 'tree',
            tag: 'span',
            mods: {
                color: 'green'
            },
            content: {
                tag: 'ul',
                content: [
                    {
                        tag: 'li',
                        content: 1
                    },
                    {
                        tag: 'li',
                        content: true
                    },
                    {
                        tag: 'li'
                    }
                ]
            }
        }
    ]
};
test('stringify', function(){
    var t = bem.getTemplates();
    equal(bem.stringify(testjson), '<div class="block block_size_big ee i-bem">'+
        '<div class="block__tree">bla</div>'+
        '<span class="block__tree block__tree_color_green">'+
            '<ul>'+
                '<li>1</li>'+
                '<li>true</li>'+
                '<li></li>'+
            '</ul>'+
        '</span>'+
    '</div>', 'ok');
});