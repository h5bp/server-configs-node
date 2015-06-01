'use strict';

/** deps */
var path = require('path'),
	webmake = require('webmake'),
	uglify = require('uglify-js'),
	Cache = require('../cache'),
	cache = new Cache();

/**
 * Configures commonjs layer.
 * @type {Function}
 */
module.exports = function(options) {
	var files = options.scripts.files,
		config = { sourceMap: options.scripts.sourceMap },
		envDev = 'development' == options.env;

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
		res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
		res.setHeader('X-Cache', cacheHeader);
		res.send(entry[0]);
	}

	/**
	 * The actual commonjs layer, invoked for each request hit.
	 * Concatenates a JavaScript file using the `CommonJS` paradigm.
	 *
	 * This is meant to be used with cache busting.
	 */
	return function commonjs(req, res, next) {
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
			webmake(path.join(options.root, url), config, function (err, content) {
				if (err) {
					next(500);
					return;
				}

				// minify
				if (options.minify) {
					content = uglify.minify(content, { fromString: true }).code;
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
