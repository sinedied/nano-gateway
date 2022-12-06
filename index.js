import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import express from 'express';
import proxy from 'express-http-proxy';
import rewrite from 'express-urlrewrite';
import yaml from 'js-yaml';

export default function gateway(configPath) {
  configPath = configPath || process.env.NANO_GATEWAY_CONFIG || 'config.yml';

  const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
  const app = express().disable('x-powered-by');
  process.chdir(path.dirname(configPath));

  function auth(req, res, next) {
    const apiKey = req.headers.authorization || req.query.apiKey;
    if (apiKey && apiKey === config.apiKey) {
      return next();
    }

    const error = 'Unauthorized';
    res.status(401, error);
    next(error);
  }

  for (const [name, service] of Object.entries(config.services)) {
    console.log(`service: ${name} at ${service.path}`);
    const routeConfig = [
      service.path,
      service.auth || (service.auth === undefined && config.auth) ? auth : null,
      service.rewrite ? rewrite(service.path, service.rewrite) : null,
      proxy(service.url),
    ];
    app.all(...routeConfig.filter(Boolean));
  }

  function showAddress(type) {
    const bound = this[type].address();
    console.log(`| ${type}://${bound.address}:${bound.port}`);
  }

  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  console.log(`nano-gateway v${pkg.version} started at:`);

  if (config.http || !config.https) {
    this.http = app.listen(config.http.port || 8080, config.http.host, showAddress.bind(this, 'http'));
  }

  if (config.https && config.https.key && config.https.cert) {
    const key = fs.readFileSync(config.https.key, 'utf8');
    const cert = fs.readFileSync(config.https.cert, 'utf8');
    const ca = config.https.ca ? fs.readFileSync(config.https.ca, 'utf8') : undefined;
    this.https = https
      .createServer({key, cert, ca}, app)
      .listen(config.https.port || 8443, showAddress.bind(this, 'https'));
  }
}
