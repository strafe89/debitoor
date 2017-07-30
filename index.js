const http = require('http');
const stream = require('stream');

function getThemAllMiddleware (req, res, next) {
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

    function pipeStream(resourceName, index, arr) {
        return new Promise((resolve, reject) => {
            const requestPath = resources[resourceName];

            res.write(`"${resourceName}": `);

            options.path = "/" + requestPath;

            http.get(options, function (resourceResponse) {
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

async function asyncSerial(array, cb) {
    for (const item of array) {
        const index = array.indexOf(item);
        await cb(item, index, array);
    }
}

function isJSON(response) {
    return response.headers['content-type'].indexOf('application/json') !== -1;
}

function isStatusCodeValid(response) {
    return response.statusCode === 200;
}

module.exports = getThemAllMiddleware;
