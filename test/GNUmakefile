LIBS = ../lib/
MODULES = ../node_modules/.bin
QUNIT = $(MODULES)/qunit

.PHONY: all l10n config t
all: config l10n t

l10n:
	$(QUNIT) -c l10n:$(LIBS)/meilin-l10n/l10n.js -t l10n/l10n-test.js
	
config:
	$(QUNIT) -c config:$(LIBS)/meilin-config/config.js -t config/config-test.js
	
t:
	$(QUNIT) -c t:$(LIBS)/meilin-t/t.js -t t/t-test.js
