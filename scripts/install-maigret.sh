#!/bin/bash
set -e
# Install Python 3.10 and venv if not present
if ! command -v python3.10 >/dev/null; then
  sudo apt-get update
  sudo apt-get install -y python3.10 python3.10-venv python3.10-dev
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
