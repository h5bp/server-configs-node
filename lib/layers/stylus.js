'use strict';

/** deps */
var path = require('path'),
	fs = require('fs'),
	processor = require('stylus'),
	CleanCSS = require('clean-css'),
	cleancss = new CleanCSS(),
	Cache = require('../cache'),
	cache = new Cache();

/**
 * Configures stylus layer.
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
		res.setHeader('Content-Type', 'text/css');
		res.setHeader('X-Cache', cacheHeader);
		res.send(entry[0]);
	}

	/**
	 * The actual Stylus layer, invoked for each request hit.
	 * Compiles a Stylus file into a CSS file.
	 *
	 * This is meant to be used with cache busting.
	 */
	return function stylus(req, res, next) {
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
			var filename = path.join(options.root, url).replace(/\.css$/, '.styl');
			fs.readFile(filename, 'utf8', function(err, content) {
				if (err) {
					next(500);
					return;
				}

				processor.render(content, { filename: filename }, function(err, content) {
					if (err) {
						next(500);
						return;
					}

					// minify
					if (options.minify) {
						content = cleancss.minify(content).styles;
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
