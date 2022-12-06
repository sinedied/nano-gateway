const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const proxy = require('express-http-proxy');
const rewrite = require('express-urlrewrite');
const foreach = require('lodash.foreach');
const yaml = require('js-yaml');

module.exports = function (configPath) {
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

  foreach(config.services, (service, name) => {
    console.log(`service: ${name} at ${service.path}`);
    const routeConfig = [
      service.path,
      service.auth || (service.auth === undefined && config.auth) ? auth : null,
      service.rewrite ? rewrite(service.path, service.rewrite) : null,
      proxy(service.url),
    ];
    app.all(...routeConfig.filter(Boolean));
  });

  function showAddress(type) {
    const bound = this[type].address();
    console.log(`| ${type}://${bound.address}:${bound.port}`);
  }

  console.log(`nano-gateway v${require('./package.json').version} started at:`);

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
};
