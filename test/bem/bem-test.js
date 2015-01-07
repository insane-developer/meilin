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
test('_2array', function(){
    var array0 = [3,5,6],
        array1 = [],
        notArrayElems = [true, 42, 'hello', null, undefined];
    equal(bem._2array(array0), array0, "Array0");
    equal(bem._2array(array1), array1, "Array0");
    for(var i = 0, l = notArrayElems.length; i < l; i++){
        var array = bem._2array(notArrayElems[i]);
        equal(array.length, 1, 'Not array elem "' + notArrayElems[i] + '" length');
        equal(array[0], notArrayElems[i], 'Not array elem "' + notArrayElems[i] + '"');
    }
    expect(12);
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
            mix: blockWmod1
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