test('invocation', function(){
    var generator = t.getGenerator('sample');
   /*-- minimal invocation abilities --*/
   /* generator is a function */
   generator('greeting', '<i>Hello</i>');
   
   /* views are accessible through module and are not generated on the method invocation */
   var view = t.getView('sample'),
   view2 = t.getView('sample');
   equal(view, view2, 'view function should be equal');
   
   /* views invocation returns processed templates */
   equal(view('greeting'), '<i>Hello</i>', 'view invocation ok');
   
   try{
       view('404');
   }catch(e){
       equal(e.message, 'Undefined view "404" in namespace "sample"', 'unknown view ok');
   }
   /*-- advanced invocation abilities --*/
   /* views are accessible through generator function */
   var view3 = generator.getView();
   equal(view, view3, 'view function should be equal');
});
test('template', function(){
    var generator = t.getGenerator('sample');
    var view = t.getView('sample')
    /* -- minimal template abilities -- */
    /* template syntax */
    generator('name', 'I am [% name %]');
    equal(view('name', {name: 'Borg'}), 'I am Borg', 'simple substitution && no recursion looping');
    equal(view('name', {designation: '1 of 9'}), 'I am ','zero data substitution');
    equal(view('name'), 'I am ','zero data invocation');
    generator('html', '<[% tag %][% attrs %]>[% content %]</[% tag %]>');
    equal(view('html', {tag: 'div', attrs: ' title="div"', content: 'quack'}),
        '<div title="div">quack</div>',
        'multiple substitution');
    
    /* template functions */
    generator('fname', function(data){
        return 'I am ' + (data.name || data.designation);
    });
    equal(view('fname', {name: 'Borg'}), 'I am Borg', 'f simple substitution 1');
    equal(view('fname', {designation: '1 of 9'}), 'I am 1 of 9','f simple substitution 2');
 });
test('context', function(){
    /* -- minimal context preservation abilities -- */
    /* views must preserve context */
    var generator = t.getGenerator('sample'),
        view = t.getView('sample'),
        context = {view:view};
    generator('contextChecker', function(){
        equal(this, context, 'Context preserved');
        /* pop view func */ 
        Array.prototype.pop.call(arguments);
        return Array.prototype.join.call(arguments, ', ');
    });
    view.call(context, 'contextChecker', {});
    equal(context.view('contextChecker'), '', 'no args passed');
    equal(context.view('contextChecker', 'ee'), 'ee', '1 arg passed');
    equal(context.view('contextChecker', 'bla', 'alb'), 'bla, alb', '2 args passed');
    equal(context.view('contextChecker', 'bla', 'alb', 42), 'bla, alb, 42', '3 args passed');
    /* nested templates must preserve context */
    generator('nestedChecker', '[% contextChecker %]');
    equal(context.view('nestedChecker'), '', '[nested]no args passed');
    equal(context.view('nestedChecker', 'ee'), 'ee', '[nested]1 arg passed');
    equal(context.view('nestedChecker', 'bla', 'alb'), 'bla, alb', '[nested]2 args passed');
    equal(context.view('nestedChecker', 'bla', 'alb', 42), 'bla, alb, 42', '[nested]3 args passed');
    
    /*-- advanced context preservation abilities --*/
    generator('viewArgChecker', function(){
        /* pop view func */ 
        var viewFunc = Array.prototype.pop.call(arguments);
        equal(viewFunc.name, 'contextBoundView', 'Last arg is the view func (at least it says so)');
        return Array.prototype.join.call(arguments, ', ');
    });
    equal(context.view('viewArgChecker'), '', '[viewFunc]no args passed');
    equal(context.view('viewArgChecker', 'ee'), 'ee', '[viewFunc]1 arg passed');
    equal(context.view('viewArgChecker', 'bla', 'alb'), 'bla, alb', '[viewFunc]2 args passed');
    generator('nestedChecker2', '[% viewArgChecker %]');
    equal(context.view('nestedChecker2'), '', '[nested viewFunc]no args passed');
    equal(context.view('nestedChecker2', 'ee'), 'ee', '[nested viewFunc]1 arg passed');
    equal(context.view('nestedChecker2', 'bla', 'alb'), 'bla, alb', '[nested viewFunc]2 args passed');
    /* expect 29 test assertions */
    expect(29);
    
    generator('nestedChecker3', 'we [% go-deeper %]');
    generator('go-deeper', 'need [% go-far-more-deeper %]');
    generator('go-far-more-deeper', function(){
        /* pop view func */ 
        var viewFunc = Array.prototype.pop.call(arguments);
        Array.prototype.unshift.call(arguments, 'go-far-more-deeper-x2');
        return 'to ' + viewFunc.apply(this, arguments);
    });
    
    generator('go-far-more-deeper-x2', function(){
        /* pop view func */ 
        var viewFunc = Array.prototype.pop.call(arguments);
        Array.prototype.unshift.call(arguments, 'viewArgCountChecker');
        return 'go ' + viewFunc.apply(this, arguments);
    });
    generator('viewArgCountChecker', function(){
        /* pop view func */ 
        Array.prototype.pop.call(arguments);
        equal(arguments.length, 2, '[viewArgCountChecker] arguments length');
        return Array.prototype.join.call(arguments);
    });

    equal(context.view('nestedChecker3', 42, false), 'we need to go 42,false', 'nestedChecker3');
    
    generator('nestedChecker4', function(){
        /* pop view func */ 
        var viewFunc = Array.prototype.pop.call(arguments);
        Array.prototype.unshift.call(arguments, 'contextChecker');
        return viewFunc.apply(this, arguments);
    });
    equal(context.view('nestedChecker4', 'bla', 'alb'), 'bla, alb', '[nested view()]2 args passed');
    expect(33);
});
/*
test('inheritance', function(){
    /*-- minimal inheritance abilities --/
    var generator = t.getGenerator('sample'),
        generator2 = t.getGenerator('2nd sample', 'sample'),
        view = generator.getView(),
        view2 = generator2.getView();
    generator('name', 'I am no one');
    generator('job', 'nope');
    generator2('job', 'To tell anyone, that [% name %]');
    equal(view2('name'), 'I am no one', 'Accessing ancestor view');
    equal(view('job'), 'nope', 'Ancestor view left intact');
    equal(view2('job'), 'To tell anyone, that I am no one', 'Descendant overrided a view');
    expect(3);
});
*/
test('extensions', function(){
    /*-- minimal extensions abilities --*/
    var generator = t.getGenerator(),
        view = generator.getView(),
        context = {view: view};
    t.registerExtension('smth', {
        enumerate: function(params, args){
            equal(this, context, 'Context preserved');
            return [params.join(','), Array.prototype.join.call(args, ',')].join(';');
        }
    });
    generator('params', '[% smth:enumerate:Jim:Joe %]');
    generator('no-params', '[% smth:enumerate: %]');
    equal(context.view('params', 'what', 'where'), 'Jim,Joe;what,where', 'Params ok');
    equal(context.view('no-params', 'what', 'where'), ';what,where', 'No params ok');

    t.unregisterExtension('smth');
    equal(context.view('params', 'what', 'where'), '', 'Unregister ok');
    expect(5);
    /*-- advanced extensions abilities --*/
    t.registerExtension('smth', {
        enumerate: function(params, args){
            equal(this, context, 'Context preserved');
            return [params.join(','), Array.prototype.join.call(args, ',')].join(';');
        },
        who: function(params, args, view){
            return view.call(this, 'name', {name: params.join()});
        }
    });
    equal(context.view('smth:enumerate:Jim:Joe', 'what', 'where'), 'Jim,Joe;what,where', '[view call]Params ok');
    equal(context.view('smth:enumerate:Jim:Joe'), 'Jim,Joe;', '[view call]args ok');
    generator('name', 'I am [% name %]');
    equal(context.view('smth:who:Jim:Joe'), 'I am Jim,Joe', '[view call]view ok');
    expect(10);
});

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
    var view = t.getView();
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
        
});