.PHONY: help install start dev build test prettier check clean deploy deploy-staging \
        apk apk-debug bundle android-install android-clean

PREFIX ?= /usr/local

help:
	@echo "Breakout71 — available targets:"
	@echo ""
	@echo "  make install         Install npm dependencies"
	@echo "  make start           Run dev server (frontend + editor backend)"
	@echo "  make dev             Alias for 'start'"
	@echo "  make build           Production build (web + APK assets); VERSION=<n> optional"
	@echo "  make test            Run jest test suite once"
	@echo "  make prettier        Format sources with prettier"
	@echo "  make check           Run checks.js"
	@echo "  make clean           Remove build artifacts and parcel cache"
	@echo "  make deploy          Run deploy.sh"
	@echo "  make deploy-staging  Run staging_deploy.sh"
	@echo ""
	@echo "Android targets (require JDK + Android SDK; all except android-clean run 'make build' first):"
	@echo "  make apk             Assemble signed release APK (needs keystore.properties)"
	@echo "  make apk-debug       Assemble debug APK"
	@echo "  make bundle          Build release AAB for Play Store"
	@echo "  make android-install Install debug APK on connected device"
	@echo "  make android-clean   Gradle clean"
	@echo ""
	@echo "Variables:"
	@echo "  PREFIX=${PREFIX}    (reserved; not currently used)"
	@echo "  VERSION             Optional version code passed to build.sh"

install:
	npm install

start:
	bash start.sh

dev: start

build:
	bash build.sh ${VERSION}

test:
	npx jest

prettier:
	npm run prettier

check:
	node checks.js

clean:
	rm -rf build .parcel-cache
	rm -rf app/src/main/assets/*
	rm -rf app/build/outputs/apk/release/*
	rm -rf app/build/outputs/bundle/release/*

deploy:
	bash deploy.sh

deploy-staging:
	bash staging_deploy.sh

apk: build
	./gradlew assembleRelease

apk-debug: build
	./gradlew assembleDebug

bundle: build
	./gradlew bundleRelease

android-install: build
	./gradlew installDebug

android-clean:
	./gradlew clean
