#!/bin/bash

bash ./build.sh

# upload to breakout-v3-staging.lecaro.me
DOMAIN="breakout-v3-staging.lecaro.me"
PUBLIC_CONTENT="./dist/*"

ssh staging "mkdir -p /opt/mup-nginx-proxy/config/html/static_sites/$DOMAIN"
rsync -avz --delete  $PUBLIC_CONTENT staging:/opt/mup-nginx-proxy/config/html/static_sites/$DOMAIN

# upload to itch.io , upload the index file directly
butler push "./dist/index.html" renanlecaro/breakout71:nightly --userversion $versionCode
