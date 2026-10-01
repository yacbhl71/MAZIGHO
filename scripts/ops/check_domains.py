#!/usr/bin/env python3
"""Secondary DNS/TLS check for ACTIVE custom domains read from the central registry."""
import json
import ipaddress
import os
import socket
import subprocess
import sys
import urllib.error
import urllib.request
from backup_db import database_parts, required


def domains_from_db():
    host, port, user, password, database = database_parts(required('DATABASE_URL'))
    # Limit to assigned custom domains; platform subdomains are monitored by primary probes.
    sql = "SELECT primaryDomain FROM stores WHERE status = 'active' AND primaryDomain IS NOT NULL AND primaryDomain <> ''"
    output = subprocess.check_output(['mysql', '--host', host, '--port', str(port), '--user', user,
                                      '--ssl-mode=VERIFY_IDENTITY', '-N', '-B', '-e', sql, database],
                                     env={**os.environ, 'MYSQL_PWD': password}, timeout=30)
    return [name.strip().lower().rstrip('.') for name in output.decode().splitlines()
            if name.strip() and not name.strip().lower().endswith('.mazigho.ch')]


def verify(domain):
    if '/' in domain or ':' in domain or len(domain) > 253 or '.' not in domain:
        return 'invalid_registry_name'
    try:
        addresses = socket.getaddrinfo(domain, 443, type=socket.SOCK_STREAM)
    except OSError:
        return 'dns_unresolved'
    if not addresses or any(not ipaddress.ip_address(addr[4][0]).is_global for addr in addresses):
        return 'dns_non_public_address'
    try:
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, request, fp, code, msg, headers, newurl):
                return None
        request = urllib.request.Request(f'https://{domain}/', method='HEAD', headers={'User-Agent': 'MAZIGHO-ops/1.0'})
        with urllib.request.build_opener(NoRedirect).open(request, timeout=9) as response:
            status = response.status
    except urllib.error.HTTPError as error:
        status = error.code
    except Exception:
        return 'tls_or_http_failure'
    return None if status < 500 else 'upstream_5xx'


def main():
    domains = domains_from_db()
    failures = {domain: result for domain in domains if (result := verify(domain))}
    print(json.dumps({'custom_domains_checked': len(domains), 'failures': failures}, ensure_ascii=False))
    return 1 if failures else 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print(f'DNS monitor could not run: {error}', file=sys.stderr)
        sys.exit(2)
