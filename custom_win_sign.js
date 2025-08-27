'use strict';
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Simple custom Windows sign script for electron-builder
// Exports an async function(context) that electron-builder will call.

function findFiles(dir, exts) {
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      result.push(...findFiles(full, exts));
    } else {
      const ext = path.extname(e.name).toLowerCase();
      if (exts.includes(ext)) result.push(full);
    }
  }
  return result;
}

function runCommand(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit' });
  if (res.error) {
    throw res.error;
  }
  if (res.status !== 0) {
    throw new Error(`${cmd} exited with code ${res.status}`);
  }
}

function signWithSigntool(file, pfx, password) {
  const signtool = 'signtool';
  const args = [
    'sign',
    '/fd', 'sha256',
    '/a',
    '/f', pfx,
    '/p', password,
    file
  ];
  runCommand(signtool, args);
}

function signWithOsslsigncode(file, pfx, password) {
  const ossl = 'osslsigncode';
  const args = [
    'sign',
    '-pkcs12', pfx,
    '-pass', password,
    '-n', 'Chatbox',
    '-in', file,
    '-out', file + '.signed'
  ];
  runCommand(ossl, args);
  fs.renameSync(file + '.signed', file);
}

module.exports = async function(context) {
  try {
    if (process.platform !== 'win32') {
      console.log('custom_win_sign: skipping because platform is not win32');
      return;
    }

    const appOutDir = context.appOutDir || (context && context.packager && context.packager.appOutDir);
    if (!appOutDir || !fs.existsSync(appOutDir)) {
      console.warn('custom_win_sign: appOutDir not found:', appOutDir);
      return;
    }

    const pfx = process.env.CSC_LINK || process.env.WIN_CERT_PATH;
    const password = process.env.CSC_KEY_PASSWORD || process.env.WIN_CERT_PASSWORD || '';
    if (!pfx) {
      console.warn('custom_win_sign: no PFX specified (CSC_LINK or WIN_CERT_PATH). Skipping signing.');
      return;
    }

    const targets = ['.exe', '.msi', '.dll', '.nupkg'];
    const files = findFiles(appOutDir, targets);
    if (files.length === 0) {
      console.log('custom_win_sign: no files to sign in', appOutDir);
      return;
    }

    console.log('custom_win_sign: signing', files.length, 'files');
    for (const f of files) {
      try {
        // prefer signtool (Windows SDK)
        try {
          signWithSigntool(f, pfx, password);
          console.log('signed with signtool:', f);
        } catch (e) {
          console.warn('signtool failed, trying osslsigncode:', e.message);
          signWithOsslsigncode(f, pfx, password);
          console.log('signed with osslsigncode:', f);
        }
      } catch (err) {
        console.error('failed to sign', f, err);
        throw err;
      }
    }

    console.log('custom_win_sign: signing complete');
  } catch (err) {
    console.error('custom_win_sign: error', err);
    throw err;
  }
};