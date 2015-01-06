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
        equal(viewFunc, view, 'Last arg is the view func');
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
});
test('inheritance', function(){
    /*-- minimal inheritance abilities --*/
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
test('extensions', function(){
    /*-- minimal extensions abilities --*/
    var generator = t.getGenerator(),
        view = generator.getView(),
        context = {view: view};
    t.registerExtension('smth', function(params, args){
        equal(this, context, 'Context preserved');
        return [params.join(','), Array.prototype.join.call(args, ',')].join(';');
    });
    generator('params', '[% smth:Jim:Joe %]');
    generator('no-params', '[% smth: %]');
    equal(context.view('params', 'what', 'where'), 'Jim,Joe;what,where', 'Params ok');
    equal(context.view('no-params', 'what', 'where'), ';what,where', 'No params ok');

    t.unregisterExtension('smth');
    equal(context.view('params', 'what', 'where'), '', 'Unregister ok');
    expect(5);
    /*-- advanced extensions abilities --*/
    t.registerExtension('smth', function(params, args){
        equal(this, context, 'Context preserved');
        return [params.join(','), Array.prototype.join.call(args, ',')].join(';');
    });
    t.registerExtension('who', function(params, args, view){
        return view.call(this, 'name', {name: params.join()});
    });
    equal(context.view('smth:Jim:Joe', 'what', 'where'), 'Jim,Joe;what,where', '[view call]Params ok');
    equal(context.view('smth:Jim:Joe'), 'Jim,Joe;', '[view call]args ok');
    generator('name', 'I am [% name %]');
    equal(context.view('who:Jim:Joe'), 'I am Jim,Joe', '[view call]view ok');
    expect(10);
});