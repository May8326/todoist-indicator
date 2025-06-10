#!/bin/sh
LANG=pl
ENCODING=UTF-8
LOCALE=pl_PL.utf8

xgettext --from-code=$ENCODING --output=po/todoist-indicator@may8326.github.com.pot *.js
msginit --no-translator --input po/todoist-indicator@may8326.github.com.pot --output-file=po/$LANG.po --locale=$LOCALE --no-wrap
# apply translations to po file and after that generate final mo file
msgfmt po/$LANG.po -o locale/$LANG/LC_MESSAGES/todoist-indicator@may8326.github.com.mo