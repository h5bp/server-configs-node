/*jslint node:true nomen:true white:true eqeq:true */
'use strict';

/** deps */
var path = require('path'),
	webmake = require('webmake'),
	Cache = require('connect/lib/cache'),
	cache = new Cache();

/**
 * Configures commonjs layer.
 * @type {Function}
 */
module.exports = function(options) {
	var scripts = options.scripts.concat,
		sourceMap = options.scripts.sourceMap;

	// removes all leading slashs if any
	scripts = scripts.map(function(entry) {
		return ('/' == entry.charAt('/') ? entry.slice(1) : entry);
	});

	function respond(res, entry, cacheHeader) {
		res.type('js');
		res.setHeader('X-Cache', cacheHeader);
		res.send(200, entry[0]);
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

		if (-1 != scripts.indexOf(url)) {
			// cache hit!
			if (entry = cache.get(baseUrl)) {
				respond(res, entry, 'HIT');
				return;
			}

			// cache miss
			webmake(path.join(options.root, url), { sourceMap: sourceMap }, function (err, content) {
				if (err) {
					next(500);
					return;
				}

				entry = cache.add(baseUrl);
				entry.push(content);
				respond(res, entry, 'MISS');
			});
		}
		else {
			next(null, req, res);
		}
	};
};
