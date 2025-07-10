#!/bin/bash
set -e
# Check for Python 3.10
if ! command -v python3.10 >/dev/null; then
  echo "Python 3.10 is required but not found. Please install it before running this script."
  exit 1
fi
# Create venv if not exists
if [ ! -d "maigret-venv" ]; then
  python3.10 -m venv maigret-venv
fi
# Activate venv and install Maigret with pip 23.x
source maigret-venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install pip==23.3.1
pip install maigret
