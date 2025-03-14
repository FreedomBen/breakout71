#!/bin/bash

bash ./build.sh

# upload to breakout.lecaro.me
DOMAIN="breakout.lecaro.me"
PUBLIC_CONTENT="./dist/*"

ssh staging "mkdir -p /opt/mup-nginx-proxy/config/html/static_sites/$DOMAIN"
rsync -avz --delete --delete-excluded --exclude="*.sh" --exclude="node_modules" --exclude="android" --exclude=".*"  $PUBLIC_CONTENT staging:/opt/mup-nginx-proxy/config/html/static_sites/$DOMAIN

# upload to itch.io , upload the index file directly
butler push "./dist/index.html" renanlecaro/breakout71:latest --userversion $versionCode
butler push  "./dist/index.html" renanlecaro/breakout71:offline --userversion $versionCode