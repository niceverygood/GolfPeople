#!/bin/bash
adb devices
adb install /Users/seungsoohan/Projects/GolfPeople/android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.golfpeople.app/.MainActivity


