#!/bin/bash

# the version number is just a unix timestamp in minutes

defaultVersionCode=$(($(date +%s) / 60))
versionCode=${1:-$defaultVersionCode}


source ~/.nvm/nvm.sh;

nvm install v21
nvm use v21

if [[ $(node --version) != v21* ]]; then
  echo "run first: nvm use v21"
  exit 1
fi

set -e
set -x




# Replace the version code and name in gradle for fdroid and play store
sed -i -e "s/^[[:space:]]*versionCode = .*/        versionCode = $versionCode/" \
       -e "s/^[[:space:]]*versionName = .*/        versionName = \"$versionCode\"/" \
       ./app/build.gradle.kts

echo "\"$versionCode\"" > src/data/version.json

# Update service worker
sed -i -e "s/VERSION = .*/ VERSION = '$versionCode'/"  ./src/PWA/sw-b71.js



# remove all exif metadata from pictures, because i think fdroid doesn't like that. odd
find  -name '*.jp*g' -o -name '*.png' | xargs exiftool -all=


npx prettier --write src/

npx jest
rm -rf dist/*
npx parcel build src/index.html
rm -rf ./app/src/main/assets/*
cp public/* dist
rm -rf ./app/src/main/assets/*
cp dist/index.html ./app/src/main/assets/
