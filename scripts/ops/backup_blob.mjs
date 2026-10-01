#!/usr/bin/env node
// Mirror every current Blob pathname+ETag into a private, versioned S3 archive.
// Source and archive are distinct: quotas still count ONLY active Vercel Blob media.
import { list, get } from '@vercel/blob';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { createWriteStream, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const bucket = process.env.BACKUP_S3_BUCKET;
const recipient = process.env.BACKUP_AGE_RECIPIENT;
if (!bucket || !recipient || !process.env.BLOB_READ_WRITE_TOKEN) {
  throw Error('BACKUP_S3_BUCKET, BACKUP_AGE_RECIPIENT and BLOB_READ_WRITE_TOKEN are required outside Vercel');
}
const temp = mkdtempSync(join(tmpdir(), 'mazigho-blob-'));
const aws = (...args) => execFileSync('aws', args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
let copied = 0, checked = 0;
try {
  let cursor;
  do {
    const page = await list({ cursor, limit: 500, mode: 'expanded' });
    for (const blob of page.blobs) {
      checked++;
      const identifier = createHash('sha256').update(blob.pathname + '\0' + blob.etag).digest('hex');
      const key = `media/objects/${identifier.slice(0, 2)}/${identifier}.age`;
      try { aws('s3api', 'head-object', '--bucket', bucket, '--key', key); continue; }
      catch (error) { if (!String(error.stderr || '').includes('404') && !String(error.stderr || '').includes('Not Found')) throw error; }
      const access = new URL(blob.url).hostname.endsWith('.private.blob.vercel-storage.com') ? 'private' : 'public';
      const response = await get(blob.url, { access, useCache: false });
      if (!response?.stream || response.statusCode !== 200) throw Error(`Blob not readable: ${identifier}`);
      const encrypted = join(temp, 'object.age');
      const age = spawn('age', ['-r', recipient], { stdio: ['pipe', 'pipe', 'inherit'] });
      const ageFinished = new Promise((resolve, reject) => { age.once('close', resolve); age.once('error', reject); });
      const source = pipeline(Readable.fromWeb(response.stream), age.stdin);
      const destination = pipeline(age.stdout, createWriteStream(encrypted, { mode: 0o600 }));
      await Promise.all([source, destination]);
      if (await ageFinished !== 0) throw Error(`age failed: ${identifier}`);
      aws('s3', 'cp', encrypted, `s3://${bucket}/${key}`, '--no-progress', '--sse', 'AES256');
      // Preserve sensitive media metadata only inside the encrypted sidecar.
      const sidecar = join(temp, 'object.json');
      writeFileSync(sidecar, JSON.stringify({ pathname: blob.pathname, etag: blob.etag, original_bytes: blob.size, archive_key: key }) + '\n', { mode: 0o600 });
      const sidecarEncrypted = join(temp, 'object.json.age');
      execFileSync('age', ['-r', recipient, '-o', sidecarEncrypted, sidecar]);
      aws('s3', 'cp', sidecarEncrypted, `s3://${bucket}/${key}.json.age`, '--no-progress', '--sse', 'AES256');
      rmSync(encrypted); rmSync(sidecar); rmSync(sidecarEncrypted);
      copied++;
    }
    if (page.hasMore && !page.cursor) throw Error('Blob pagination missing cursor');
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  console.log(JSON.stringify({ checked, copied, bucket: 'private archive' }));
} finally { rmSync(temp, { recursive: true, force: true }); }
