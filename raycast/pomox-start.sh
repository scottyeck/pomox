#!/bin/bash

# @raycast.schemaVersion 1
# @raycast.title Pomox Start
# @raycast.mode silent
# @raycast.argument1 { "type": "text", "placeholder": "minutes", "optional": true }

source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"

if [ -n "$1" ]; then
  pomox start -d "$1"
else
  pomox start
fi
