#!/usr/bin/env python3
"""Notify configured private incident webhook without exposing credentials or user data."""
import json
import os
import sys
import urllib.request
from urllib.parse import urlsplit


def main():
    url = os.getenv('OPS_ALERT_WEBHOOK_URL', '')
    parsed = urlsplit(url)
    if parsed.scheme != 'https' or not parsed.hostname:
        raise RuntimeError('OPS_ALERT_WEBHOOK_URL must be an HTTPS URL')
    if len(sys.argv) != 3 or sys.argv[1] not in ('critical', 'warning'):
        raise RuntimeError('usage: notify.py critical|warning <operation>')
    payload = json.dumps({'text': f'MAZIGHO {sys.argv[1].upper()}: {sys.argv[2][:80]} failed. Review {os.environ.get("GITHUB_SERVER_URL", "https://github.com")}/{os.environ.get("GITHUB_REPOSITORY", "yacbhl71/MAZIGHO")}/actions/runs/{os.environ.get("GITHUB_RUN_ID", "")}.'}).encode()
    request = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(request, timeout=10) as response:
        if response.status >= 300:
            raise RuntimeError(f'Notification HTTP {response.status}')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'Notification failed: {error}', file=sys.stderr)
        sys.exit(1)
