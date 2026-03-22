# Burn Test Robot

An Arduino-based robot designed to perform repeatable burn tests on material samples. A soldering iron is mounted on a servo-driven arm that presses against a sample for a precisely timed duration.

## Background

Manual burn testing is tedious and inconsistent. This robot automates the process so each sample gets the same pressure, temperature and duration every time.

## Hardware

- Arduino Uno R3
- SG90 micro servo
- 40W soldering iron (modified mount)
- 3D-printed sample clamp
- 12V relay module for iron power control

## How It Works

1. Place the sample in the clamp.
2. Set the desired burn duration via a rotary encoder.
3. Press the start button — the relay powers the iron, the servo lowers it onto the sample, holds for the set time, then retracts.
4. Results are logged to serial output for easy recording.

The code is intentionally minimal — under 200 lines of C++ — so it's easy to adapt for other repeatable contact-test scenarios.
