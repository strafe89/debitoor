const http = require('http');

/**
 * Get them all middleware
 * @module getThemAll
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @return {Promise}
 */
function getThemAllMiddleware(req, res, next) {
    const resources = req.query;
    const urlParts = req.headers.host.split(':');
    const options = {
        hostname: urlParts[0],
        port: urlParts[1] || '80',
        method: req.method,
        headers: req.headers,
        timeout: 5000
    };

    const resourceNames = Object.keys(resources);

    res.setHeader("Content-Type", "application/json");
    res.write('{');

    return asyncSerial(resourceNames, pipeStream).then(() => {
        res.write('}');
        res.end();
    });

    /**
     * Fetches given resource and writes payload to response
     * @function
     * @param {string} resourceName - Resource name
     * @param {Object} index - Resource index in array
     * @param {Array.<String>} arr - Resource names array
     * @return {Promise}
     */
    function pipeStream(resourceName, index, arr) {
        return new Promise((resolve, reject) => {
            const requestPath = resources[resourceName];

            res.write(`"${resourceName}": `);

            options.path = "/" + requestPath;

            http.get(options, function(resourceResponse) {
                if (!isStatusCodeValid(resourceResponse)) {
                    res.write(`"Unexpected status code: ${resourceResponse.statusCode}"`);
                    return resolve();
                }
                if (!isJSON(resourceResponse)) {
                    res.write(`"Unexpected \\"Content-type\\" header"`);
                    return resolve();
                }
                resourceResponse.on('data', function(chunk) {
                    res.write(chunk);
                });
                resourceResponse.on('error', function(e) {
                    reject(e);
                });
                resourceResponse.on('end', function() {
                    resolve();
                });
            });
        }).then(() => {
            if (index + 1 < arr.length) {
                res.write(',');
            }
        }).catch(() => {
            // handle broken json ?
        });
    }
}

/**
 * Runs promises one by one
 * @function
 * @param {Array} array - Any array
 * @param {function} callback - Callback that returns promise
 */
async function asyncSerial(array, callback) {
    for (const item of array) {
        const index = array.indexOf(item);
        await callback(item, index, array);
    }
}

/**
 * Check response for content type
 * @function
 * @param {Object} response - http response
 * @return {boolean}
 */
function isJSON(response) {
    return response.headers['content-type'].indexOf('application/json') !== -1;
}

/**
 * Check response for status code
 * @function
 * @param {Object} response - http response
 * @return {boolean}
 */
function isStatusCodeValid(response) {
    return response.statusCode === 200;
}

module.exports = getThemAllMiddleware;
