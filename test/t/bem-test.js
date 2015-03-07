test('configure', function(){
    t.configure({
        bem: {
            elemDelimiter: '++',
            modDelimiter: '--',
            modValueDelimiter: '---',
            jsInitClassname: 'js-auto'
        }
    });
    equal(t.bem.buildBEMClassnames({
        block: 'smth',
        mods: {
            size: 'big'
        },
        mix: {
            elem: 'hand'
        },
        js: true
    }), 'smth smth--size---big smth++hand js-auto', 'configure ok');
    t.configure({
        bem: {
            elemDelimiter: '__',
            modDelimiter: '_',
            jsInitClassname: 'i-bem'
        }
    });
});

/**
 * TODO: compare with bemhtml templater
 */
test('buildBEMClassnames', function(){
    var str = 'already_a_string';
    equal(t.bem.buildBEMClassnames(str), str, 'String');
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
    equal(t.bem.buildBEMClassnames(block), 'smth', 'block');
    equal(t.bem.buildBEMClassnames(elem), 'smth__hand', 'elem');
    equal(t.bem.buildBEMClassnames(blockWmod0), 'smth smth_size_big smth_color_red', 'blockWmod0');
    equal(t.bem.buildBEMClassnames(elemWmod0), 'smth__hand smth__hand_size_big smth__hand_color_red', 'elemWmod0');
    equal(t.bem.buildBEMClassnames(blockWmod1), 'smth smth_size_big smth_color_red i-bem', 'blockWmod1');
    equal(t.bem.buildBEMClassnames(elemWmod1), 'smth__hand smth__hand_size_big smth__hand_color_red', 'elemWmod1');
    equal(t.bem.buildBEMClassnames(blockWmix0), 'smth mixclass', 'blockWmix0');
    equal(t.bem.buildBEMClassnames(blockWmix1), 'smth-other smth smth_size_big smth_color_red i-bem', 'blockWmix0');
    equal(t.bem.buildBEMClassnames(incompleteElem, 'smth'), 'smth__hand', 'incompleteElem');
    equal(t.bem.buildBEMClassnames(incompleteMix, 'clock'), 'smth clock__arrow', 'incompleteMix');
});

test('buildBEMEntity', function(){
    var cases = {
        'block': { id: 'block' },
        'block__elem': { id: 'block__elem' },
        'block_mod_val': { id: 'block', modName: 'mod', modVal: 'val' },
        'block__elem_mod_val': { id: 'block__elem', modName: 'mod', modVal: 'val' }
    };
    for(var id in cases){
        var q = t.bem.buildBEMEntity(id),
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
    var gen = t.getGenerator(),
        view = t.getView();
    equal(view('stringify', testjson), '<div class="block block_size_big ee i-bem">'+
        '<div class="block__tree">bla</div>'+
        '<span class="block__tree block__tree_color_green">'+
            '<ul>'+
                '<li>1</li>'+
                '<li>true</li>'+
                '<li></li>'+
            '</ul>'+
        '</span>'+
    '</div>', 'ok');
    
    gen('document', function(){
        return [
            '<!doctype html>',
            {
                tag: 'html',
                content: 'hello'
            }
        ];
    });
    equal(view('bemjson', {block: 'document'}), '<!doctype html><html>hello</html>', 'array as bemjson in template');
});

test('bemjson', function(){
    var gen0 = t.getGenerator('#0'),
        view0 = gen0.getView();

    /* override template for elem 'tree' with mod 'color'='green' */
    gen0('block__tree_color_green', '<div class="block__tree block__tree_color_green">'+
        '<div>some html</div>[% content %]</div>');

    equal(view0('bemjson', testjson),  '<div class="block block_size_big ee i-bem">'+
        '<div class="block__tree">bla</div>'+
        /* should be an html from the template above */
        '<div class="block__tree block__tree_color_green">'+
            '<div>some html</div>'+
            '<ul>'+
                '<li>1</li>'+
                '<li>true</li>'+
                '<li></li>'+
            '</ul>'+
        '</div>'+
    '</div>', 'ok');
    
    gen0('a', function(data){
        return {
            tag: 'table',
            block: 'a',
            content: data.content
        };
    });
    equal(view0('bemjson', {
        block: 'a',
        content: [
            {
                elem: 'b',
                tag: 'tr',
                content: [
                    {
                        tag: 'td',
                        content: '0'
                    },
                    {
                        tag: 'td',
                        content: '1'
                    },
                    {
                        tag: 'td',
                        content: '2'
                    }
                ]
            },
            {
                elem: 'c',
                tag: 'tr',
                content: [
                    {
                        tag: 'td',
                        content: '0'
                    },
                    {
                        tag: 'td',
                        content: '1'
                    },
                    {
                        tag: 'td',
                        content: '2'
                    }
                ]
            }
        ]
    }), '<table class="a">'+
        '<tr class="a__b">'+
            '<td>0</td>'+
            '<td>1</td>'+
            '<td>2</td>'+
        '</tr>'+
        '<tr class="a__c">'+
            '<td>0</td>'+
            '<td>1</td>'+
            '<td>2</td>'+
        '</tr>'+
    '</table>', 'List items');
    
    gen0('me', function(data){
        return {
            block: 'me',
            tag: 'span',
            content: data.content
        };
    });
    equal(view0('bemjson', {block: 'me', content: 'Q'}), '<span class="me">Q</span>', 'template returns bemjson');
    
    gen0('document', function(data){
        if(data.once){
            return data;
        }
        return [
            '<!doctype html>',
            {
                block: 'document',
                once: true,
                tag: 'html',
                content: 'hello'
            }
        ];
    });
    equal(view0('bemjson', {block: 'document'}), '<!doctype html><html class="document">hello</html>', 'array as bemjson in template');
});


test('namespace separation', function(){
    var gen0 = t.getGenerator('#0'),
        gen1 = t.getGenerator('#1'),
        view0 = gen0.getView(),
        view1 = gen1.getView();
    gen0('uniq', 'i am unique');
    gen1('qinu', 'i am euqinu');

    gen0('likeall', 'bla bla gen0');
    gen1('likeall', 'bla bla gen1');

    /* bem templates */

    equal(view0('bemjson', { block: 'uniq' }), 'i am unique', 'bem #1');
    equal(view1('bemjson', { block: 'qinu' }), 'i am euqinu', 'bem #2');
    equal(view0('bemjson', { block: 'likeall' }), 'bla bla gen0', 'bem #3');
    equal(view1('bemjson', { block: 'likeall' }), 'bla bla gen1', 'bem #4');
});