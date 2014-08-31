LIBS = ../lib/
MODULES = ../node_modules/.bin
QUNIT = $(MODULES)/qunit

.PHONY: all l10n resolve-config t
all: resolve-config l10n t

l10n:
	$(QUNIT) -c l10n:$(LIBS)/meilin-l10n/l10n.js -t l10n/l10n-test.js
	
resolve-config:
	$(QUNIT) -c resolveConfig:$(LIBS)/meilin-resolve-config/resolve-config.js -t resolve-config/resolve-config-test.js
	
t:
	$(QUNIT) -c t:$(LIBS)/meilin-t/t.js -t t/t-test.js
