#!/bin/bash

# Invalidate web cache
# Generate a random number between 1000 and 9999
random_number=$(shuf -i 1000-9999 -n 1)
# Use sed to replace the pattern with the random number
sed -i "s/\?v=[0-9]*/\?v=$random_number/g" ./app/src/main/assets/index.html


# Replace the version code and name in gradle for fdroid and play store
versionCode=$(($(date +%s) / 60))
versionName=$(date +"%Y-%m-%d %H:%M:%S")
sed -i '' -e "s/^[[:space:]]*versionCode = .*/        versionCode = $versionCode/" \
       -e "s/^[[:space:]]*versionName = .*/        versionName = \"$versionName\"/" \
       ./app/build.gradle.kts

git add .
git commit -m "Automatic deploy $versionCode"
git tag -f $versionCode
git push


DOMAIN="breakout.lecaro.me"
PUBLIC_CONTENT="./app/src/main/assets/"
ssh staging "mkdir -p /opt/mup-nginx-proxy/config/html/static_sites/$DOMAIN"
rsync -avz --delete --delete-excluded --exclude="*.sh" --exclude="node_modules" --exclude="android" --exclude=".*"  $PUBLIC_CONTENT staging:/opt/mup-nginx-proxy/config/html/static_sites/$DOMAIN


# generate zip for itch
rm -f breakout.zip
zip -j breakout.zip app/src/main/assets/*