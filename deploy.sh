#!/bin/bash

#Randomly shuffle the version ids
# Generate a random number between 1000 and 9999
random_number=$(shuf -i 1000-9999 -n 1)

# Use sed to replace the pattern with the random number
sed -i "s/\?v=[0-9]*/\?v=$random_number/g" ./app/src/main/assets/index.html


DOMAIN="breakout.lecaro.me"
PUBLIC_CONTENT="./app/src/main/assets/"
ssh staging "mkdir -p /opt/mup-nginx-proxy/config/html/static_sites/$DOMAIN"
rsync -avz --delete --delete-excluded --exclude="*.sh" --exclude="node_modules" --exclude="android" --exclude=".*"  $PUBLIC_CONTENT staging:/opt/mup-nginx-proxy/config/html/static_sites/$DOMAIN


# generate zip for itch
rm -f breakout.zip
zip -j breakout.zip app/src/main/assets/*