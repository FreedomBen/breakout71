

source ~/.nvm/nvm.sh;

nvm install v21
nvm use v21

rm -rf .parcel-cache
npx run-p dev:*