#!/bin/bash
adb disconnect 192.168.0.57:37343
sleep 1
adb devices > /Users/seungsoohan/Projects/GolfPeople/adb_result.log 2>&1
adb -s R3CWB0E56WH install -r /Users/seungsoohan/Projects/GolfPeople/android/app/build/outputs/apk/debug/app-debug.apk >> /Users/seungsoohan/Projects/GolfPeople/adb_result.log 2>&1
adb -s R3CWB0E56WH shell am start -n com.golfpeople.app/.MainActivity >> /Users/seungsoohan/Projects/GolfPeople/adb_result.log 2>&1


