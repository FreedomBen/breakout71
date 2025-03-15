#!/bin/bash

set -e
set -x

versionCode=$(($(date +%s) / 60))

bash ./build.sh $versionCode

# Create a release commit and tag
git add .
git commit -m "Build $versionCode"
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

