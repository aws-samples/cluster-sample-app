/*
** Cluster Sample Application - https://github.com/aws-samples/cluster-sample-app 
© 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of
the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// A basic node application leveraging the Express lib
var express = require("express");

const { networkInterfaces } = require('os');

const app = express();
const port = process.env.CLUSTER_SAMPLE_APP_PORT || 3000;

var server = app.listen(port, () => {
  console.info("Cluster sample app started...");
});

// Now add a default GET handler
app.get("/", (req, res, next) => {
  console.debug('Processing a GET request on /');
  let str = '<body><div style="text-align: center;">';
  str = str + '<div style="display: inline-block; background-color: #92a8d1; text-align: center; border-style: solid;"><h1>Greetings from Cluster Sample App!</h1>';
  str = str + `<h3>Today is ${new Date().toLocaleString(
  'en-gb',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
      })}`+'</h3>';
  str = str + '<div>This app is running in a container having the following IP addresses: '+'<ul style="list-style-type:none;">';

  getAllIPAddrs().forEach((ip) => {
    str = str + `<li>${ip}</li>`
  });

  str = str + '</ul></div></div></body>';
  res.send(str);
});

function getAllIPAddrs() {

  const results = [];
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        results.push(name + ': '+net.address);
      }
    }
  }

  return results;

}

module.exports = server;
