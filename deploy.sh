#!/bin/bash
set -e
set -x

# Replace the version code and name in gradle for fdroid and play store
versionCode=$(($(date +%s) / 60))

sed -i '' -e "s/^[[:space:]]*versionCode = .*/        versionCode = $versionCode/" \
       -e "s/^[[:space:]]*versionName = .*/        versionName = \"$versionCode\"/" \
       ./app/build.gradle.kts



# Invalidate web cache
sed -i "s/\?v=[0-9]*/\?v=$versionCode/g" ./app/src/main/assets/index.html

# remove all exif metadata from pictures, because i think fdroid doesn't like that. odd
find  -name '*.jp*g' -o -name '*.png' | xargs exiftool -all=


git add .
git commit -m "Automatic deploy $versionCode"
git tag -a $versionCode -m $versionCode
git push


DOMAIN="breakout.lecaro.me"
PUBLIC_CONTENT="./app/src/main/assets/"
ssh staging "mkdir -p /opt/mup-nginx-proxy/config/html/static_sites/$DOMAIN"
rsync -avz --delete --delete-excluded --exclude="*.sh" --exclude="node_modules" --exclude="android" --exclude=".*"  $PUBLIC_CONTENT staging:/opt/mup-nginx-proxy/config/html/static_sites/$DOMAIN


# generate zip for itch
rm -f breakout.zip
zip -j breakout.zip app/src/main/assets/*