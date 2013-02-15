# [H5BP](http://h5bp.github.com) <sup>0.0.5</sup>

HTML5 boilerplate (H5BP) inspired server config for node.js.

[![Build Status](https://secure.travis-ci.org/h5bp/node-server-config.png)](http://travis-ci.org/h5bp/node-server-config)

## Installation

```bash
npm install h5bp
```

## Quick Start

To create a simple server:

```javascript
var h5bp = require('h5bp');

var app = h5bp.createServer({ root: __dirname + '/public' });
app.listen(3000);
```

To use it as a connect / express middleware:

```javascript
var express = require('express');

var app = express();
// ...
app.use(h5bp({ root: __dirname + '/public' }));
app.use(express.compress());
app.use(express.static(__dirname + '/public'));
// ...
app.listen(3000);
```

*Note: When using `h5bp` with other middlewares, use `h5bp` in the first position, before any `static` middleware.*

## Options

*(Coming soon)*

## Contribute

*(Coming soon)*

### Run the tests

From the root of the project:
```bash
npm test
```
