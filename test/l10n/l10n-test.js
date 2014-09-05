var path = require('path');
test('configure', function(){
    l10n.configure({
        "langs": ["ru", "en", "tr"],
        "path": "l10n/translations.json",
        "needConvert": false
    });
    deepEqual(l10n.getTranslations(), require(path.resolve('l10n/translations.json')), 'configure ok');
});
test('convertTranslations', function(){
    var src = {
        "head": {
            "title": {
                "ru": "Заголовок",
                "en": "Title"
            }
        },
        "body": {
            "foot": {
                "about": {
                    "ru": "Что это?",
                    "en": "WAT?"
                }
            }
        }
    },
    res = {
        "ru": {
            "head.title": "Заголовок",
            "body.foot.about": "Что это?"
        },
        "en": {
            "head.title": "Title",
            "body.foot.about": "WAT?"
        },
        "tr": {
            "head.title": "",
            "body.foot.about": ""
        }
    };
    deepEqual(l10n.convertTranslations(src),res, 'ok');
});