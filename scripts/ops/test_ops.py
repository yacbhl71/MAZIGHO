import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parent))
from backup_db import database_parts
from check_domains import verify
from verify_bucket import verify as verify_bucket


class InfrastructureScriptsTests(unittest.TestCase):
    def test_url_parser(self):
        self.assertEqual(database_parts('mysql://alice:p%40ss@tidb.example:4000/mazigho')[2:], ('alice', 'p@ss', 'mazigho'))
        for url in ('https://example.com/test', 'mysql://alice@localhost/', 'mysql://alice@localhost/other/db'):
            with self.assertRaises(ValueError):
                database_parts(url)

    @patch('check_domains.socket.getaddrinfo', return_value=[(2, 1, 6, '', ('127.0.0.1', 443))])
    def test_private_ip_blocked(self, _):
        self.assertEqual(verify('example.com'), 'dns_non_public_address')

    def test_invalid_registry_name_blocked(self):
        self.assertEqual(verify('localhost'), 'invalid_registry_name')

    def test_retention_does_not_expire_active_media(self):
        rules = json.loads((Path(__file__).parents[2] / 'ops/backup/s3-lifecycle.json').read_text())['Rules']
        database = next(rule for rule in rules if rule['ID'].startswith('database-'))
        media = next(rule for rule in rules if rule['ID'].startswith('media-'))
        self.assertEqual(database['Expiration']['Days'], 30)
        self.assertEqual(media['NoncurrentVersionExpiration']['NoncurrentDays'], 30)
        self.assertNotIn('Expiration', media)

    def test_bucket_refuses_missing_object_lock(self):
        with self.assertRaisesRegex(RuntimeError, 'Object Lock'):
            verify_bucket({'Status': 'Enabled'}, {},
                          {'PublicAccessBlockConfiguration': {'BlockPublicAcls': True, 'IgnorePublicAcls': True,
                          'BlockPublicPolicy': True, 'RestrictPublicBuckets': True}}, {'Rules': []})

    def test_bucket_accepts_aws_cli_response(self):
        verify_bucket({'Status': 'Enabled'},
                      {'ObjectLockConfiguration': {'ObjectLockEnabled': 'Enabled',
                          'Rule': {'DefaultRetention': {'Mode': 'GOVERNANCE', 'Days': 30}}}},
                      {'PublicAccessBlockConfiguration': dict.fromkeys(
                          ('BlockPublicAcls', 'IgnorePublicAcls', 'BlockPublicPolicy', 'RestrictPublicBuckets'), True)},
                      {'Rules': [{'ID': ident, 'Status': 'Enabled'} for ident in
                          ('database-daily-expire-after-30-days', 'media-keep-current-retain-replaced-versions-30-days')]})


if __name__ == '__main__':
    unittest.main()
