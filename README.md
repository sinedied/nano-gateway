# nano-gateway

[![NPM version](https://img.shields.io/npm/v/nano-gateway.svg)](https://www.npmjs.com/package/nano-gateway)
[![Build status](https://github.com/sinedied/nano-gateway/workflows/build/badge.svg)](https://github.com/sinedied/nano-gateway/actions)
![Node version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
[![Docker layers](https://images.microbadger.com/badges/image/sinedied/nano-gateway.svg)](https://microbadger.com/images/sinedied/nano-gateway)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![](https://user-images.githubusercontent.com/593151/34394053-379cfa3c-eb57-11e7-855d-ef15cc5d3bcb.png)

> Lightweight API gateway for home-scale projects.

**Features:**
- Single-file YAML configuration
- HTTPS support
- Secure endpoints with API key
- URL rewriting
- Less than [50 LOC](index.js) :smile:

## Installation

```bash
npm install -g nano-gateway
```

## Usage
```sh
Usage: nanog [--config file.yml] [--keygen]
```

Use the `nanog` command to start the gateway.

By default, it will use the `config.yml` configuration in the current working directory, but any file can be specified
using either the `NANO_GATEWAY_CONFIG` environment variable or the `--config` option.

The `--keygen` will generate a suitable API key to use in your configuration.

## Configuration

Here is an [example config.yml](config.yml) configuration:

```yaml
http:                 # optional, enable HTTP gateway
  port: 8080          # optional, specify port for HTTP (default is 8080)
https:                # optional, enable HTTPS gateway
  cert: 'cert.pem'    # required, certificate path
  key: 'privkey.pem'  # required, private key path
  ca: 'chain.pem'     # optional, override trusted CA certificates
  port: 8443          # optional, specify port for HTTPS (default is 8443)
auth: true            # optional, enable API key authorization by default for all services
apiKey: '123456'      # required if auth is enabled, use nanog --keygen to generate a new key
services:             # required, define here the services to proxify
  ip:                           # required, service name
    path: '/ip'                 # required, endpoint(s) (use Express route syntax, see npmjs.com/path-to-regexp)
    url: 'https://httpbin.org'  # required, target url for
    auth: false                 # optional, authorization can be set or overriden by service
  quote:                        # another service, add as many as you need
    path: '/jokes/*'            # matches any routes under /jokes/
    rewrite: '/jokes/random'    # optional, rewrite URL (for syntax, see npmjs.com/express-urlrewrite)
    url: 'https://api.chucknorris.io'
```

### API key

Endpoints secured by API key can be consumed either by using an `apiKey` query parameter:
```sh
curl https://gateway.com/endpoint?apiKey=<your_api_key>
```
or by using an `Authorization` header:
```sh
curl -H "Authorization: <your_api_key>" https://gateway.com/endpoint
```

> Note: It is **strongly** recommended to use only HTTPS with API keys, otherwise your credentials will circulate in
> clear over the network and may be intercepted.

### HTTPS

To enable HTTPS you need a valid SSL certificate.

Free [LetsEncrypt](https://letsencrypt.org) certificates can be obtained using [certbot](https://certbot.eff.org).

For testing purposes, you can also generate a self-signed certificate using this command:
```sh
openssl req -nodes -new -x509 -keyout privkey.pem -out cert.pem
```

After you have your certificate, use it in your configuration like this:
```yaml
https:
  cert: 'cert.pem'
  key: 'privkey.pem'
  ca: 'chain.pem' # optional, override trusted CA certificates
```

## Running on Docker

A minimal [Docker image](https://hub.docker.com/r/sinedied/nano-gateway/) based on `node:alpine` is also available
for deployment.

You just need to map a folder with a `config.yml` file in it to the `/config` volume:
```
docker pull sinedied/nano-gateway
docker run --d -v <your_config_dir>:/config -p 8443:8443 --name nano-gateway sinedied/nano-gateway
```
