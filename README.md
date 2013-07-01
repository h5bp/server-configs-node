# [H5BP](http://h5bp.github.com) <sup>[![Version Badge](http://vb.teelaun.ch/h5bp/node-server-config.svg#0.0.7)](https://npmjs.org/package/h5bp)</sup>

**HTML5 boilerplate** (H5BP) server config for node.js.

[![Build Status](https://secure.travis-ci.org/h5bp/node-server-config.png)](http://travis-ci.org/h5bp/node-server-config)
[![Build Status](https://gemnasium.com/ngryman/node-server-config.png)](https://gemnasium.com/ngryman/node-server-config)

`h5bp` for node.js follows the guidelines of the [Apache] version:
 - secures backup and hidden files.
 - optionally redirects `www.yoursite.tld` to `yoursite.tld` or `yoursite.tld` to `www.yoursite.tld`.
 - offers a simple cache busting mechanism.
 - normalize content types.
 - optionally enables CORS.
 - sets correct cache expires depending of the type of resource.
 - and some others...

It also focuses on offering additional features such as on-the-fly script concatenation using **CommonJS** or **AMD**.

[Apache]: https://github.com/h5bp/server-configs/tree/master/apache

### Next release focus (v0.0.8)

 - refactoring code and tests.
 - responsive images: #13.

## Installation

```bash
npm install h5bp
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

## Release notes

```
v0.0.7
  - better mime type sniffing.
  - on-th-fly sass, less and sytlus compilation.
  - on-th-fly scripts compilation using commonjs or amd.
  - on-th-fly scripts and stylesheets minification.
  - various other minor bugs.
```

## Contributors

```
 project  : node-server-config
 repo age : 2 years, 4 months
 active   : 67 days
 commits  : 123
 files    : 85
 authors  : 
    63	Nicolas Gryman          51,2%
    17	xonecas                 13,8%
     9	Nick Baugh              7,3%
     8	Sean Caetano Martin     6,5%
     7	Benjamin Tan            5,7%
     3	Clemens Stolle          2,4%
     3	sean                    2,4%
     2	alrra                   1,6%
     2	AD7six                  1,6%
     2  David Clarke            1.6%
     2  Dean Gelber             1,6%
     1	Mike Almond             0,8%
     1	David Murdoch           0,8%
     1	Nicolas Gallagher       0,8%
     1	Chad Smith              0,8%
     1	Przemek Matylla         0,8%
```

### How to contribute?

If you want to contribute for a **bug** or an **enhancement**, please do it on `master`.
`master` is our **stable** branch where releases and fixes land.

If you want to contribute for a **new feature**, please do it on `develop`.
`develop` is our **mainline** where the next release is prepared.

Here is the workflow overview:

- Fork the repository.
- Clone it.
- Checkout the right branch.
- Add your awesome contribution.
- Test!
- Push to **Github**.
- Open a pull request to the right branch.

### Always run tests

This project tries to be as **test driven** as possible.
So your contribution should always be covered by associated *functional test(s)*.
This ensure that what you are actually adding work as expected and do not break anything.
We use [Mocha] to run the tests and [Chai] as the assertion library.

Before pushing anything to **Github**, please ensure that all tests are passing.

From the root of the project you can run tests like this:
```bash
npm test
```

[Mocha]: http://visionmedia.github.io/mocha/
[Chai]: http://chaijs.com/

### Keeping your repo in sync

Please **rebase** instead of **merging**.
This is just to avoid having a lot of merge commits polluting the history of the project.

```bash
# this adds our repo as another remote, only the first time
git remote add h5bp git://github.com/whoever/whatever.git

# fetches all branches from h5bp repo, only the first time
git fetch h5bp

# make sure your have checkout the right branch
git checkout [master|develop]

# rebase h5bp/master
git rebase h5bp/master
```

If you are not comfortable with rebasing, please take a look at http://git-scm.com/book/en/Git-Branching-Rebasing
or ask us some help :)

### Squash your commits

At the end of your pull request review, you may have several commits in it.
Please squash all your commits into one with a clear message.
This is to have a clear history in the project when each commit is relevant to a **feature**, **enhancement** or **bug**.

If you are not comfortable with squashing commits, please take a look at http://gitready.com/advanced/2009/02/10/squashing-commits-with-rebase.html
or ask us some help again :)

### Thanks!
