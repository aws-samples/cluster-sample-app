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
const express = require("express");
const { networkInterfaces } = require('os');

const app = express();
const port = process.env.CLUSTER_SAMPLE_APP_PORT || 3000;

let hitCounter = 1;

var server = app.listen(port, () => {
  console.info("Cluster sample app started...");
  console.info("Listening on port "+ port);
});

const dateLocaleOptions = {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'};

// Now add a default GET handler
app.get("/", (req, res, next) => {
  console.debug('Processing a GET request on /');
  let str = `<head><style>${getCSSString()}</style></head>`;
  str = str + '<body>';
  str = str + '<div style="display: inline-block; text-align: center; padding: 20px;"><h1>Greetings from Cluster Sample App!</h1>';
  str = str + `<h3>Today is ${new Date().toLocaleString(
  'en-gb', dateLocaleOptions)}`+'</h3>';
  str = str + `<p>This web page has been hit ${hitCounter} time(s)</p>`;

  str = str + '<div><p>This app is running in a container having the following IP addresses: ';

  str = str + '<table text-align: center; border-style: solid;><th>Name</th><th>Type</th><th>CIDR</th><th>Address</th>';
  getAllIPAddrs().forEach((ip) => {
    str = str + `<tr><td>${ip.name}</td><td>${ip.infos.family}</td><td>${ip.infos.cidr}</td><td>${ip.infos.address}</td></tr>`;
  });

  str = str + '</table></p></div></body>';
  res.send(str);

    hitCounter+=1;
});

function getCSSString() {
  let css = 'body { text-align: center; }';
  css = css + 'table { width: 98%; border: 1px solid black; }';
  css = css + 'th { background-color: #f7a105; color: white; }';
  css = css + 'th, td { border: 1px; padding: 3px; text-align: center; }';
  css = css + 'tr:nth-child(even) {background-color: #f2f2f2;}';
  return css;
}

function getAllIPAddrs() {

  const results = [];
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if ((net.family === 'IPv4' || net.family === 'IPv6') && !net.internal) {
        results.push({name, infos: net});
      }
    }
  }

  return results;

}

module.exports = server;
