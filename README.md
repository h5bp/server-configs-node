# [H5BP](http://h5bp.github.com) <sup>[![Version Badge](http://vb.teelaun.ch/h5bp/server-configs-node.svg#0.0.7)](https://npmjs.org/package/h5bp)</sup>

**HTML5 boilerplate** (H5BP) server config for node.js.

[![NPM](https://nodei.co/npm/h5bp.png)](https://nodei.co/npm/h5bp/)

[![Build Status](https://secure.travis-ci.org/h5bp/server-configs-node.svg)](http://travis-ci.org/h5bp/server-configs-node)
[![Dependency Status](https://david-dm.org/h5bp/server-configs-node.svg?theme=shields.io)](https://david-dm.org/h5bp/server-configs-node)
[![devDependency Status](https://david-dm.org/h5bp/server-configs-node/dev-status.svg?theme=shields.io)](https://david-dm.org/h5bp/server-configs-node#info=devDependencies)

`h5bp` for node.js follows the guidelines of the [Apache] version:
 - secures backup and hidden files.
 - optionally redirects `www.yoursite.tld` to `yoursite.tld` or vice versa.
 - offers a simple cache busting mechanism.
 - normalize content types.
 - optionally enables CORS.
 - sets correct cache expires depending of the type of resource.
 - and some others...

It also focuses on offering additional features such as on-the-fly script concatenation using **CommonJS** or **AMD**.

[Apache]: https://github.com/h5bp/server-configs-apache

### Next release focus (v0.1.3)

 - refactoring code and tests.
 - responsive images: #13.

## Installation

```bash
npm install --save h5bp
```

## Quick Start

### Create a simple http server

```javascript
var h5bp = require('h5bp');

var app = h5bp.createServer({ root: __dirname + '/public' });
app.listen(3000);
```

`app` is an instance of an `express` application. You can add additional middlewares or routes if you like.

### Use it as a connect / express middleware

```javascript
var express = require('express'),
    h5bp = require('h5bp');

var app = express();
app.use(h5bp({ root: __dirname + '/public' }));

// in order to serve files, you should add the two following middlewares
app.use(express.compress());
app.use(express.static(__dirname + '/public'));
app.listen(3000);
```

### Concatenate scripts on-the-fly

If you want to split your application source files but only serve one file, you can use the on-the-fly concatenation.
If you are familiar with node.js, you can use the **CommonJS** style. You can also use the **AMD** style.

```javascript
app.use(h5bp({
    root: __dirname + '/public',
    scripts: {
        files: ['app.js'],
        processor: 'commonjs'   // can also be "amd"
    }
}));
```

At the first request hit to `/app.js`, the server will compile, cache and serve the file. Any subsequent request will
serve the cached file without any performance impact.

So, this feature is meant to be used with the [cache busting mechanism] in order to ensure the client always has the
latest resource version. If you restart your server, the cache will be flushed.

Note that the next release will provide a *development mode* where the server will simply disable its cache and
always serve the latest version of the file.

[cache busting mechanism]: https://github.com/h5bp/server-configs/tree/master/apache#cache-busting

## Options

There are several options you can pass to the middleware.

`app.use(h5bp(options));`

### root

Tells the filesystem path to the root directory of static resources. This options is mandatory if you serve static files.

### www

Forces **www** if `true`, forces **non-www** if `false`, does nothing if not defined. By default, this is disabled.

### cors

Enables **CORS** for everything. By default this is disabled.

### dotfiles

Enables access to dotfiles. By default this is disabled.

### scripts

Tells which scripts to concatenate.

This is an object with the following properties:

#### files

This is an array of files to concatenate. Their path is relative to the `root` option. Their URL will be absolute.

For example, if you set **files** to `['scripts/app.js']` and **root** to `/home/h5bp/app/`:
 - The path will be: `/home/h5bp/app/scripts/app.js`.
 - The served URL will be: `yoursite.tld/scripts/app.js`.

#### processor

Tells which processor to use for scripts concatenation.

For now, it can be one of the following values:
 - `commonjs`: will concatenate files using the **CommonJS** method (`require/exports`).
 - `amd`: will concatenate files using the **AMD** method (`require/define`).

## Additional options

The `h5bp.createServer` function takes the same options, plus additional ones.

The `callback` is optional. It is a custom middleware that you can register directly if you want to.

`h5bp.createServer(options, [callback]);`

### server

Tells which type of server you want to use.

It can be one of the following values:
 - `express`: uses **express**, this is the default value.
 - `connect`: uses **connect**.

### logger

Tells if you want to log server requests or not. This can also be an object containing [logger options].

[logger options]: http://www.senchalabs.org/connect/middleware-logger.html

### compress

Tells if you want to serve `gzipped` content or not. By default this is `true`.

If you are using `h5bp` as a middleware, we strongly encourage you to use the `compress` middleware provided by
**express** / **connect**.

## License

[MIT License](LICENSE.md)
