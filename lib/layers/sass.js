'use strict';

/** deps */
var path = require('path'),
	fs = require('fs'),
	processor = require('node-sass'),
	CleanCSS = require('clean-css'),
	cleancss = new CleanCSS(),
	Cache = require('../cache'),
	cache = new Cache();

/**
 * Configures commonjs layer.
 * @type {Function}
 */
module.exports = function(options) {
	var files = options.stylesheets.files,
		envDev = 'development' == process.env.NODE_ENV;

	// automatically minify in production env
	options.minify = options.minify || ('production' == options.env);

	// removes all leading slashs if any
	files = files.map(function(entry) {
		return ('/' == entry.charAt('/') ? entry.slice(1) : entry);
	});

	function cacheKey(url) {
		return url + (options.minify ? '#min' : '');
	}

	function respond(res, entry, cacheHeader) {
		res.setHeader('Content-Type', 'text/css; charset=utf-8');
		res.setHeader('X-Cache', cacheHeader);
		res.send(entry[0]);
	}

	/**
	 * The actual SASS layer, invoked for each request hit.
	 * Compiles a SASS file into a CSS file.
	 *
	 * This is meant to be used with cache busting.
	 */
	return function sass(req, res, next) {
		var baseUrl = req.baseUrl.slice(1),
			url = req.url.slice(1),
			entry;

		if (~files.indexOf(url)) {
			// cache hit!
			if (!envDev && (entry = cache.get(cacheKey(baseUrl)))) {
				respond(res, entry, 'HIT');
				return;
			}

			// cache miss
			var filename = path.join(options.root, url).replace('.css', '.scss');
			processor.render({ file: filename }, function(err, result) {
				if (err) {
					next(500);
					return;
				}

				var content = result.css;

				// minify
				if (options.minify) {
					content = cleancss.minify(content).styles;
				}

				entry = cache.add(cacheKey(baseUrl));
				entry.push(content);
				respond(res, entry, 'MISS');
			});
		}
		else {
			next(null, req, res);
		}
	};
};
