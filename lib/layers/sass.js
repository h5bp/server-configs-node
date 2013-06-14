'use strict';

/** deps */
var path = require('path'),
	fs = require('fs'),
	processor = require('node-sass'),
	cleancss = require('clean-css'),
	Cache = require('connect/lib/cache'),
	cache = new Cache();

/**
 * Configures commonjs layer.
 * @type {Function}
 */
module.exports = function(options) {
	var files = options.stylesheets.files,
		envDev = 'development' == process.env.NODE_ENV;

	// removes all leading slashs if any
	files = files.map(function(entry) {
		return ('/' == entry.charAt('/') ? entry.slice(1) : entry);
	});

	function cacheKey(url) {
		return url + (options.minify ? '#min' : '');
	}

	function respond(res, entry, cacheHeader) {
		res.setHeader('Content-Type', 'text/css');
		res.setHeader('X-Cache', cacheHeader);
		res.send(200, entry[0]);
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

		if (-1 != files.indexOf(url)) {
			// cache hit!
			if (!envDev && (entry = cache.get(cacheKey(baseUrl)))) {
				respond(res, entry, 'HIT');
				return;
			}

			// cache miss
			var filename = path.join(options.root, url).replace('.css', '.scss');
			fs.readFile(filename, 'utf8', function(err, content) {
				if (err) {
					next(500);
					return;
				}

				processor.render(content, function(err, content) {
					if (err) {
						next(500);
						return;
					}

					// minify
					if (options.minify) {
						content = cleancss.process(content);
					}

					entry = cache.add(cacheKey(baseUrl));
					entry.push(content);
					respond(res, entry, 'MISS');
				});
			});
		}
		else {
			next(null, req, res);
		}
	};
};
