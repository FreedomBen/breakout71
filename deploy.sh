#!/bin/bash

if grep -rE "T[O]DO|F[I]XME|console\.log" src
then
  echo "You have left some TO""DO or logs"
  exit 1
fi

set -e
set -x

versionCode=$(($(date +%s) / 60))

bash ./build.sh $versionCode

# Create a release commit
git add .
git commit -m "Build $versionCode"
git push
# Auto tagging created random releases on fdroid, not great.
# git tag -a $versionCode -m $versionCode

# upload to breakout.lecaro.me
DOMAIN="breakout.lecaro.me"
PUBLIC_CONTENT="./build/*"

ssh staging "mkdir -p /opt/mup-nginx-proxy/config/html/static_sites/$DOMAIN"
rsync -avz --delete --delete-excluded --exclude="*.sh" --exclude="node_modules" --exclude="android" --exclude=".*"  $PUBLIC_CONTENT staging:/opt/mup-nginx-proxy/config/html/static_sites/$DOMAIN

# upload to itch.io , upload the index file directly
butler push "./build/index.html" renanlecaro/breakout71:latest --userversion $versionCode
butler push  "./build/index.html" renanlecaro/breakout71:offline --userversion $versionCode

