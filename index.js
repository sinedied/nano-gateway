const express = require('express');
const proxy = require('express-http-proxy');
const rewrite = require('express-urlrewrite');
const foreach = require('lodash.foreach');
const yaml = require('js-yaml');
const fs = require('fs');
const pkg = require('./package.json');

module.exports = function (configPath) {
  configPath = configPath || process.env.NANO_GATEWAY_CONFIG || 'config.yml';

  const config = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
  const app = express().disable('x-powered-by');

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
      proxy(service.url)
    ];
    app.all.apply(app, routeConfig.filter(e => e));
  });

  this.server = app.listen(config.http.port || 8080, config.http.host, () => {
    const bound = this.server.address();
    console.log(`nano-gateway v${pkg.version} started at ${bound.address}:${bound.port}`);
  });
};
