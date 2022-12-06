#!/usr/bin/env node
import gateway from '../index.js';
import minimist from 'minimist';

const base62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
const help = 'Usage: nanog [--config file.yml] [--keygen]\n';
const args = minimist(process.argv.slice(2), {
  boolean: ['help', 'keygen'],
  string: 'config'
});

if (args.help) {
  console.info(help);
} else if (args.keygen) {
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += base62[Math.floor(Math.random() * base62.length)];
  }
  console.log(key);
} else {
  gateway(args.config);
}
