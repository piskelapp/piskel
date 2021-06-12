#!/bin/bash

grep -rl "os.tmpDir" node_modules --include \*.js | while read -r file; do
  
  sed -i 's/os.tmpDir/os.tmpdir/g' $file

done
