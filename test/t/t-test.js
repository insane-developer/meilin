test('invocation', function(){
   var generator = t.getGeneratorForNamespace('sample');
   /*-- minimal invocation abilities --*/
   /* generator is a function */
   generator('greeting', '<i>Hello</i>');
   
   /* views are accessible through module and are not generated on the method invocation */
   var view = t.getViewForNamespace('sample'),
   view2 = t.getViewForNamespace('sample');
   equal(view, view2, 'view function should be equal');
   
   /* views invocation returns processed templates */
   equal(view('greeting'), '<i>Hello</i>', 'view invocation ok');
   
   /*-- advanced invocation abilities --*/
   /* views are accessible through generator function */
   var view3 = generator.getView();
   equal(view, view3, 'view function should be equal');
   
   /* Template's namespace can be obtained through module */
   var ns = t.getNamespace('sample');
   equal('greeting' in ns, true, 'entity was put in ns');
   equal(typeof ns.greeting, 'function', 'generated entity is function');
   equal(ns.greeting(), '<i>Hello</i>', 'template ok');
   
});
test('template', function(){
    var generator = t.getGeneratorForNamespace('sample');
    var view = t.getViewForNamespace('sample')
    /* -- minimal template abilities -- */
    /* template syntax */
    generator('name', 'I am [% name %]');
    equal(view('name', {name: 'Borg'}), 'I am Borg', 'simple substitution');
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