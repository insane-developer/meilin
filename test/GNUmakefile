LIBS = ../lib/
MODULES = ../node_modules/.bin
QUNIT = $(MODULES)/qunit

TARGETS = l10n config t bem
.PHONY: all $(TARGETS)
all: $(TARGETS)

$(TARGETS):
	$(QUNIT) -c $@:$(LIBS)/meilin-$@/$@.js -t $@/$@-test.js