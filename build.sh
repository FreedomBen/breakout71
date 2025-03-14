#!/bin/bash

# the version number is just a unix timestamp in minutes
versionCode=$1

source ~/.nvm/nvm.sh;

nvm install v21
nvm use v21

if [[ $(node --version) != v21* ]]; then
  echo "run first: nvm use v21"
  exit 1
fi


if grep -rE "T[O]DO|F[I]XME|console\.log" src
then
  echo "You have left some TO""DO or logs"
  exit 1
fi

set -e
set -x




# Replace the version code and name in gradle for fdroid and play store
sed -i -e "s/^[[:space:]]*versionCode = .*/        versionCode = $versionCode/" \
       -e "s/^[[:space:]]*versionName = .*/        versionName = \"$versionCode\"/" \
       ./app/build.gradle.kts

echo "\"$versionCode\"" > src/version.json

# Update service worker
sed -i -e "s/VERSION = .*/ VERSION = '$versionCode'/"  ./src/sw-b71.js



# remove all exif metadata from pictures, because i think fdroid doesn't like that. odd
find  -name '*.jp*g' -o -name '*.png' | xargs exiftool -all=


npx prettier --write src/

npm run build

rm -rf ./app/src/main/assets/*
cp public/* dist
cp dist/* ./app/src/main/assets/
