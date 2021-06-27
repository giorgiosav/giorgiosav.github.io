#!/bin/bash - 

set -o nounset                              # Treat unset variables as an error

echo "Controllo file senza etichetta di lingua..."
echo "-------------------------------------------"
echo
find en it -name '*.html' -o -name '*.md' -exec grep -L "^lang:[ ]*.." {} \;


echo "Controllo identificatori di lingua duplicati..."
echo "-----------------------------------------------"
echo
function lang_id_dup() {
  grep -R "^lang-id:" $1 | awk -F: '{ print $1 " " $3 }' | sort -k2 | uniq -d -f1
}

lang_id_dup en
lang_id_dup it


