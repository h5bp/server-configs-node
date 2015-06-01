/**
 * h5bp for node.js
 */

'use strict';

/** deps */
var http = require('http'),
	express = require('express'),
	async = require('async'),
	h5bp;

/**
 * Configures h5bp middleware.
 * @type {Function}
 */
h5bp = module.exports = function(options) {
	var layers = [null];

	options = options || {};
	options.server = options.server || 'express';
	options.env = process.env.NODE_ENV || 'development';

	// headers layer comes first
	layers.push(require('./layers/headers')(options));

	// scripts concatenation & stylesheets compilation
	[
		{
			type: 'scripts',
			processors: /commonjs|amd/,
			defaultProcessor: 'commonjs'
		},
		{
			type: 'stylesheets',
			processors: /sass|less|stylus/,
			defaultProcessor: 'sass'
		}
	].forEach(function(resource) {
		var resOpts = options[resource.type];
		if (!resOpts) return;

		if (!resOpts.processor) {
			resOpts.processor = resource.defaultProcessor;
		}
		else if (!resource.processors.test(resOpts.processor)) {
			var choices = resource.processors.toString().replace(/\//g, '').replace(/\|/g, ', ');
			throw new Error('Script concatenation processor can be ' + choices);
		}

		if ('string' == typeof resOpts.files) {
			resOpts.files = [resOpts.files];
		}
		if (!Array.isArray(resOpts.files)) {
			var resName = resource.type.replace(/s$/, '');
			throw new Error('There is no ' + resName + ' to process');
		}

		layers.push(require('./layers/' + resOpts.processor)(options));
	});

	/**
	 * The actual h5bp middleware, invoked for each request hit.
	 * Calls internally each layer in waterfall.
	 */
	return function(req, res, next) {
		// passes initial arguments to the waterfall as `async.waterfall` does not support this
		layers[0] = (function(req, res) {
			return function(callback) {
				callback(null, req, res);
			};
		}(req, res));

		async.waterfall(layers, function(code) {
			if (null === code) {
				next();
			}
			else {
				var err = new Error(http.STATUS_CODES[code]);
				err.status = code;

				// early return for:
				// - redirects
				// - forbidden, prioritize 403 over 404
				if (/301|302|403/.test(err.status)) {
					res.statusCode = err.status;
					res.end(err.message);
				}
				else {
					next(err);
				}
			}
		});
	};
};

/**
 * Creates a h5bp powered server.
 *
 * @param {Object} options
 *
 * @param {String} [options.server=express] 'express' or 'connect' or 'http'.
 * Let H5BP create the server and configure it properly.
 * For express/connect, H5BP set up a default stack of middlewares which can be customized with other option arguments.
 * For http, H5BP just create the server to be up and ready, without additional features.
 *
 * @param {Boolean} [options.cors=false] true or false.
 * Enabled CORS for everything.
 *
 * @param {Boolean} [options.dotfiles=false] true or false.
 * Enables access to dotfiles.
 *
 * @param {Boolean} options.www true or false.
 * Force www if true, force non-www if false, does nothing if undefined.
 *
 * @param {String} options.root a valid path of the root directory to serve.
 * Adds and configures static and favicon middlewares to serve static files.
 *
 * @param {Boolean|Object} [options.logger=false] true or false or logger options.
 * @see http://www.senchalabs.org/connect/middleware-logger.html
 * Adds and configures a logger middleware on H5BP one.
 *
 * @param {Function} [callback]
 * Called on every requests, after h5bp goodness.
 */
h5bp.createServer = function(options, callback) {
	var app;

	options = options || {};

	// defaults to express
	if (undefined === options.server) {
		options.server = 'express';
	}
	// backward compatibility, falls back to express
	else if ('http' == options.server) {
		options.server = 'express';
	}

	app = require(options.server)();

	// pushes logger at the top of the stack
	if (true === options.logger || 'object' == typeof options.logger) {
		app.use(express.logger(options.logger));
	}
	// then compress
	if (false !== options.compress) {
		app.use(require('compression')());
	}
	// h5bp right after
	app.use(h5bp(options));
	// then file serving
	if (options.root) {
		app.use(express['static'](options.root, { etag: false }));
	}
	// then callback
	if (callback) {
		app.use(callback);
	}

	return app;
};
