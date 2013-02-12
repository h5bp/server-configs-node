/*jslint node:true nomen:true white:false */
/* h5bp for node.js
 *
 * NOTES:
 * compression: use the compress middleware provided by connect 2.x to enable gzip/deflate compression
 *              http://www.senchalabs.org/connect/compress.html
 *
 * concatenation: use on of the following middlewares to enable automatic concatenation of static assets
 *                  - https://github.com/mape/connect-assetmanager
 *                  - https://github.com/TrevorBurnham/connect-assets
 */
(function () {
    'use strict';

    var h5bp,

        http = require('http'),
        path = require('path'),
        connect = require('connect'),

    /** cache values */
        ONE_HOUR = 60 * 60,
        ONE_WEEK = ONE_HOUR * 24 * 7,
        ONE_MONTH = ONE_WEEK * 4,
        ONE_YEAR = ONE_MONTH * 12,

        /** mime type regexps */
        RE_MIME_IMAGE = /image/,
        RE_MIME_FONT = /(application\/(font-woff|x-font-ttf|vnd\.ms-fontobject|font\/opentype))/,
        RE_MIME_DATA = /(text\/(cache-manifest|html|xml)|application\/(xml|json))/,
        RE_MIME_FEED = /application\/(rss\+xml|atom\+xml)/,
        RE_MIME_FAVICON = /image\/x-icon/,
        RE_MIME_MEDIA = /(image|video|audio|text\/x-component|application\/(font-woff|x-font-ttf|vnd\.ms-fontobject|font\/opentype))/,
        RE_MIME_CSSJS = /(text\/(css|x-component)|application\/javascript)/,

        /** misc regexps */
        RE_WWW = /^www\./,
        RE_MSIE = /MSIE/,
        RE_HIDDEN = /(^|\/)\./,
        RE_SRCBAK = /\.(bak|config|sql|fla|psd|ini|log|sh|inc|swp|dist)|~/,

        /** enhances default (apache) mime types */
        mime = connect.mime;

    mime.load(path.join(__dirname, 'h5bp.types'));


    /**
     * configures h5bp middleware
     *
     * @type {Function}
     */
    h5bp = module.exports = function (options) {
        options = options || {};
        options.server = options.server || 'express';

        /**
         * the actual h5bp middleware, invoked for each request hit
         */
        return function (req, res, next) {
            var url  = req.url,
                host = req.headers.host,
                ua   = req.headers['user-agent'],
                type = '',
                cc = '',
                err;

            // private function to respond with the appropriate code.
            function respond(code) {
                var err = new Error(http.STATUS_CODES[code]);
                err.status = code;

                // early return for:
                // - redirects
                // - forbidden, prioritize 403 over 404
                if (/301|302|403/.test(err.status)) {
                    res.statusCode = err.status;
                    res.end(err.message);
                } else {
                    next(err);
                }
            }

            // Block access to "hidden" directories or files whose names begin with a
            // period. This includes directories used by version control systems such as
            // Subversion or Git.

            if (RE_HIDDEN.test(url)) {
                return respond(403);
            }

            // Block access to backup and source files. These files may be left by some
            // text/html editors and pose a great security danger, when anyone can access
            // them.

            if (RE_SRCBAK.test(url)) {
                return respond(403);
            }

            /**
             * Suppress or force the "www." at the beginning of URLs
             */

            // The same content should never be available under two different URLs -
            // especially not with and without "www." at the beginning, since this can cause
            // SEO problems (duplicate content). That's why you should choose one of the
            // alternatives and redirect the other one.

            // By default option 1 (no "www.") is activated.
            // no-www.org/faq.php?q=class_b

            // If you'd prefer to use option 2, just comment out all option 1 lines
            // and uncomment option 2.

            // IMPORTANT: NEVER USE BOTH RULES AT THE SAME TIME!

            // ----------------------------------------------------------------------

            // Option 1:
            // Rewrite "www.example.com -> example.com".

            if (false === options.www && RE_WWW.test(host)) {
                res.setHeader('location', '//' + host.replace(RE_WWW, '') + url);
                return respond(301);
            }

            // ----------------------------------------------------------------------

            // Option 2:
            // Rewrite "example.com -> www.example.com".
            // Be aware that the following rule might not be a good idea if you use "real"
            // subdomains for certain parts of your website.

            if (true === options.www && !RE_WWW.test(host)) {
                res.setHeader('location', '//www.' + host.replace(RE_WWW, '') + url);
                respond(301);
            }

            /**
             * Proper MIME type for all files
             */

            // early mime type sniffing

            type = connect.mime.lookup(req.url);
            res.setHeader('Content-Type', type);

            /**
             * Better website experience for IE users
             */

            // Force the latest IE version, in various cases when it may fall back to IE7 mode
            //  github.com/rails/rails/commit/123eb25#commitcomment-118920
            // Use ChromeFrame if it's installed for a better experience for the poor IE folk

            if (RE_MSIE.test(ua) && 'text/html' === type) {
                res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
            }

            /**
             * Cross-domain AJAX requests
             */

            // Serve cross-domain Ajax requests, disabled by default.
            // enable-cors.org
            // code.google.com/p/html5security/wiki/CrossOriginRequestSecurity

            if (options.cors) {
                res.setHeader('Access-Control-Allow-Origin', '*');
            }

            /**
             * CORS-enabled images (@crossorigin)
             */

            // Send CORS headers if browsers request them; enabled by default for images.
            // developer.mozilla.org/en/CORS_Enabled_Image
            // blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html
            // hacks.mozilla.org/2011/11/using-cors-to-load-webgl-textures-from-cross-domain-images/
            // wiki.mozilla.org/Security/Reviews/crossoriginAttribute

            if (RE_MIME_IMAGE.test(type)) {
                res.setHeader('Access-Control-Allow-Origin', '*');
            }

            /**
             * Webfont access
             */

            // Allow access from all domains for webfonts.
            // Alternatively you could only whitelist your
            // subdomains like "subdomain.example.com".

            if (RE_MIME_FONT.test(url)) {
                res.setHeader('Access-Control-Allow-Origin', '*');
            }

            /**
             * Allow concatenation from within specific js and css files
             */

            // e.g. Inside of script.combined.js you could have
            //   <!--#include file="libs/jquery-1.5.0.min.js" -->
            //   <!--#include file="plugins/jquery.idletimer.js" -->
            // and they would be included into this single file.

            // TODO

            /**
             * Expires headers (for better cache control)
             */

            // These are pretty far-future expires headers.
            // They assume you control versioning with filename-based cache busting
            // Additionally, consider that outdated proxies may miscache
            //   www.stevesouders.com/blog/2008/08/23/revving-filenames-dont-use-querystring/

            // If you don't use filenames to version, lower the CSS and JS to something like
            // "access plus 1 week".

            // note: we don't use connect.static maxAge feature because it does not allow fine tune

            // Perhaps better to whitelist expires rules? Perhaps.

            // cache.appcache needs re-requests in FF 3.6 (thanks Remy ~Introducing HTML5)
            // Your document html
            // Data
            if (RE_MIME_DATA.test(type)) {
                cc = 'public,max-age=0';
            }
            // Feed
            else if (RE_MIME_FEED.test(type)) {
                cc = 'public,max-age=' + ONE_HOUR;
            }
            // Favicon (cannot be renamed)
            else if (RE_MIME_FAVICON.test(type)) {
                cc = 'public,max-age=' + ONE_WEEK;
            }
            // Media: images, video, audio
            // HTC files  (css3pie)
            // Webfonts
            else if (RE_MIME_MEDIA.test(type)) {
                cc = 'public,max-age=' + ONE_MONTH;
            }
            // CSS and JavaScript
            else if (RE_MIME_CSSJS.test(type)) {
                cc = 'public,max-age=' + ONE_YEAR;
            }
            // Misc
            else {
                cc = 'public,max-age=' + ONE_MONTH;
            }

            /**
             * Prevent mobile network providers from modifying your site
             */

            // The following header prevents modification of your code over 3G on some
            // European providers.
            // This is the official 'bypass' suggested by O2 in the UK.

            cc += (cc ? ',' : '') + 'no-transform';
            // hack: send does not compute ETag if header is already set, this save us ETag generation
            res.setHeader('cache-control', '');

            /**
             * ETag removal
             */

            // Since we're sending far-future expires, we don't need ETags for
            // static content.
            //   developer.yahoo.com/performance/rules.html#etags

            // hack: send does not compute ETag if header is already set, this save us ETag generation
            res.setHeader('etag', '');

            // handle headers correctly after connect.static

            res.on('header', function () {
                res.setHeader('cache-control', cc);
                // remote empty etag header
                res.removeHeader('etag');
            });

            /**
             * Stop screen flicker in IE on CSS rollovers
             */

            // The following directives stop screen flicker in IE on CSS rollovers - in
            // combination with the "ExpiresByType" rules for images (see above).

            // TODO

            /**
             * Set Keep-Alive Header
             */

            // Keep-Alive allows the server to send multiple requests through one
            // TCP-connection. Be aware of possible disadvantages of this setting. Turn on
            // if you serve a lot of static content.

            res.setHeader('connection', 'keep-alive');

            /**
             * Cookie setting from iframes
             */

            // Allow cookies to be set from iframes (for IE only)
            // If needed, specify a path or regex in the Location directive.

            // TODO

            /**
             * Built-in filename-based cache busting
             */

            // If you're not using the build script to manage your filename version revving,
            // you might want to consider enabling this, which will route requests for
            // /css/style.20110203.css to /css/style.css

            // To understand why this is important and a better idea than all.css?v1231,
            // read: github.com/h5bp/html5-boilerplate/wiki/cachebusting

            req.url = req.url.replace(/^(.+)\.(\d+)\.(js|css|png|jpg|gif)$/, '$1.$3');

            /**
             * A little more security
             */

            // do we want to advertise what kind of server we're running?

            if ('express' === options.server) {
                res.removeHeader('X-Powered-By');
            }

            next();
        };
    };

    /**
     * creates a h5bp powered server.
     *
     * @param options
     *
     * @param options.server (express|connect|http) [express]
     * Let H5BP create the server and configure it properly.
     * For express/connect, H5BP set up a default stack of middlewares which can be customized with other option arguments.
     * For http, H5BP just create the server to be up and ready, without additional features.
     *
     * @param options.cors true or false [false]
     * Enabled CORS for everything.
     *
     * @param options.www true, false or undefined [undefined]
     * Force www if true, force non-www if false, does nothing if undefined.
     *
     * @param options.root
     * Adds and configures static and favicon middlewares to serve static files.
     *
     * @param options.logger true, false or logger options [false]
     * Adds and configures a logger middleware on H5BP one.
     *
     * @param callback
     * Called on every requests, after h5bp goodness.
     */
    h5bp.createServer = function (options, callback) {
        var app;

        options = options || {};

        // defaults to express
        if (undefined === options.server) {
            options.server = 'express';
        }
        // backward compatibility, falls back to connect
        else if ('http' === options.server) {
            options.server = 'connect';
        }

        app = require(options.server)();

        // pushes h5bp at the top of the stack
        app.use(h5bp(options));
        // then logger
        if (true === options.logger || 'object' === typeof options.logger) {
            app.use(connect.logger(options.logger));
        }
        // then compress
        if (false !== options.compress) {
            app.use(connect.compress());
        }
        // then file serving
        if (options.root) {
            app.use(
                connect['static'](options.root),
                connect.favicon(options.root)
            );
        }
        // then callback
        if (callback) {
            app.use(callback);
        }
        // finally error handler
        app.use(connect.errorHandler());

        return app;
    };
}());
