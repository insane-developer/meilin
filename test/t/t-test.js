test('t', function(){
   var generator = t.getGeneratorForNamespace('sample');
   generator('greeting', 'Hello, [% name %]');
   var ns = t.getNamespace('sample');
   equal('greeting' in ns, true, 'entity was put in ns');
   equal(typeof ns.greeting, 'function', 'generated entity is function');
   equal(ns.greeting({name: 'Q'}), 'Hello, Q', 'template ok');
   
   var view = t.getViewForNamespace('sample'),
       view2 = t.getViewForNamespace('sample');
   equal(view, view2, 'view function should be equal');
   equal(view('greeting', {name: 'Q'}), ns.greeting({name: 'Q'}), 'view invocation ok');
   
});