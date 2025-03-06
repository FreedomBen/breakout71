#!/bin/bash
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

# the version number is just a unix timestamp in minutes
versionCode=$(($(date +%s) / 60))

# Replace the version code and name in gradle for fdroid and play store
sed -i -e "s/^[[:space:]]*versionCode = .*/        versionCode = $versionCode/" \
       -e "s/^[[:space:]]*versionName = .*/        versionName = \"$versionCode\"/" \
       ./app/build.gradle.kts

echo "\"$versionCode\"" > src/version.json

# remove all exif metadata from pictures, because i think fdroid doesn't like that. odd
find  -name '*.jp*g' -o -name '*.png' | xargs exiftool -all=

npx prettier --write src/

npm run build

rm -rf ./app/src/main/assets/*
cp public/* dist
cp dist/* ./app/src/main/assets/


# Create a release commit and tag
git add .
git commit -m "Build and deploy of version $versionCode"
git tag -a $versionCode -m $versionCode
git push

# upload to breakout.lecaro.me
DOMAIN="breakout.lecaro.me"
PUBLIC_CONTENT="./dist/*"

ssh staging "mkdir -p /opt/mup-nginx-proxy/config/html/static_sites/$DOMAIN"
rsync -avz --delete --delete-excluded --exclude="*.sh" --exclude="node_modules" --exclude="android" --exclude=".*"  $PUBLIC_CONTENT staging:/opt/mup-nginx-proxy/config/html/static_sites/$DOMAIN

# upload to itch.io , upload the index file directly
butler push "./dist/index.html" renanlecaro/breakout71:latest --userversion $versionCode
butler push  "./dist/index.html" renanlecaro/breakout71:offline --userversion $versionCode