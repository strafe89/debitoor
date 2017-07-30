# debitoor 
Technical task. Get them all - express middleware

[![Build Status](https://travis-ci.org/strafe89/debitoor.svg?branch=master)](https://travis-ci.org/strafe89/debitoor)

### Description
Make API handle that - build a reusable module/middleware for GETting multiple resources in one go. Should be easy to inject into any existing express app / api.
### Usage
```bashp
npm install getthemall-stream
```
then add endpoint in your express application
```js
app.get('/api/resources', require('getthemall-stream'));
```
Example of final use

GET api/resources ? users=api/users & customer=api/customers/23 & countries=api/countries ..

returns {users: [..], customer: {..}, countries: [..] } 

That's it. enjoy
