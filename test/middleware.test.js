var assert = require('assert');
var express = require('express');
var dummyjson = require('dummy-json');
var supertest = require('supertest');
var fs = require('fs');
var getthemall = require('../index');
var usersTemplate = fs.readFileSync('./test/templates/users.hbs', { encoding: 'utf8' });
var fakeUsers = dummyjson.parse(usersTemplate);
var customersTemplate = fs.readFileSync('./test/templates/users.hbs', { encoding: 'utf8' });
var fakeCustomers = dummyjson.parse(customersTemplate);
var fakeCustomer = JSON.parse(fakeCustomers)[0];
var fakeApp = express();
var mountUrl = '/api/resources';

fakeApp.get(mountUrl, getthemall);
fakeApp.get('/api/users', function(req, res) {
    res.set('Content-Type', 'application/json');
    res.send(fakeUsers);
});
fakeApp.get('/api/customers', function(req, res) {
    res.set('Content-Type', 'application/json');
    res.send(fakeCustomers);
});
fakeApp.get('/api/customers/:customerId', function(req, res) {
    res.set('Content-Type', 'application/json');
    res.send(fakeCustomer);
});
fakeApp.get('/api/legacy', function(req, res) {
    res.set('Content-Type', 'application/xml');
    res.send('some xml');
});
fakeApp.get('/api/failure', function(req, res) {
    res.sendStatus(500);
});

describe('get them all express middleware', function() {
    it('fetch multiple resources: arrays', function(done) {
        var targetUrl = mountUrl + '?users=api/users&customers=api/customers';

        supertest(fakeApp)
            .get(targetUrl)
            .expect(200)
            .end(function(err, res) {
                assert(typeof res.body, 'object');
                assert(Array.isArray(res.body.users), true);
                assert(res.body.users, fakeUsers);
                assert(Array.isArray(res.body.customers), true);
                assert(res.body.customers, fakeCustomers);
                done();
            });
    });

    it('fetch multiple resources: arrays plus single', function(done) {
        var targetUrl = mountUrl + '?users=api/users&customers=api/customers&single=api/customers/888';

        supertest(fakeApp)
            .get(targetUrl)
            .expect(200)
            .end(function(err, res) {
                assert(typeof res.body, 'object');
                assert(Array.isArray(res.body.users), true);
                assert(res.body.users, fakeUsers);
                assert(Array.isArray(res.body.customers), true);
                assert(res.body.customers, fakeCustomers);
                assert(!Array.isArray(res.body.single), true);
                assert(res.body.single, fakeCustomer);
                done();
            });
    });

    it('fetch xml endpoint', function(done) {
        var targetUrl = mountUrl + '?users=api/users&customers=api/customers&deprecated=api/legacy';

        supertest(fakeApp)
            .get(targetUrl)
            .expect(200)
            .end(function(err, res) {
                assert(typeof res.body, 'object');
                assert(Array.isArray(res.body.users), true);
                assert(res.body.users, fakeUsers);
                assert(Array.isArray(res.body.customers), true);
                assert(res.body.customers, fakeCustomers);
                assert(typeof res.body.deprecated, 'string');
                assert(res.body.deprecated, "Unexpected \"Content-type\" header");
                done();
            });
    });

    it('fetch missing endpoint', function(done) {
        var targetUrl = mountUrl + '?users=api/users&customers=api/customers&surprise=api/wtf';

        supertest(fakeApp)
            .get(targetUrl)
            .expect(200)
            .end(function(err, res) {
                assert(typeof res.body, 'object');
                assert(Array.isArray(res.body.users), true);
                assert(res.body.users, fakeUsers);
                assert(Array.isArray(res.body.customers), true);
                assert(res.body.customers, fakeCustomers);
                assert(typeof res.body.surprise, 'string');
                assert(res.body.surprise, "Unexpected status code: 404");
                done();
            });
    });

    it('fetch failing endpoint', function(done) {
        var targetUrl = mountUrl + '?users=api/users&customers=api/customers&failure=api/failure';

        supertest(fakeApp)
            .get(targetUrl)
            .expect(200)
            .end(function(err, res) {
                assert(typeof res.body, 'object');
                assert(Array.isArray(res.body.users), true);
                assert(res.body.users, fakeUsers);
                assert(Array.isArray(res.body.customers), true);
                assert(res.body.customers, fakeCustomers);
                assert(typeof res.body.failure, 'string');
                assert(res.body.failure, "Unexpected status code: 500");
                done();
            });
    });
});
