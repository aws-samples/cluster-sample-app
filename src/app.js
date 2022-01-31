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

const express = require("express");
const { networkInterfaces } = require('os');
const awsFactory = require('aws-sdk');
const ddb = require('./ddbClient.js');

let nodeId = undefined;
const app = express();
const applicationHttpPort = process.env.CLUSTER_SAMPLE_APP_PORT || 3000;
const currentAWSRegion = process.env.AWS_REGION || 'eu-west-3'

awsFactory.config.update({region: currentAWSRegion});

let mainPageHitCounter = 1;
let healthCheckHitCounter = 0;

// ***********************
// Application initializer
// ***********************
var server = app.listen(applicationHttpPort, () => {
  // Get DynamoDB Client
  ddb.init(awsFactory);

  // Collect application node current ipV4 addresses
  const ipv4Addrs = getAllIPAddrs();

  // Set our node ID
  nodeId = Math.random().toString(16).slice(2);

  // Store our own node data in DynamoDB
  ddb.saveNodeData(nodeId, ipv4Addrs, mainPageHitCounter, healthCheckHitCounter).then(() => {
    console.info("Cluster sample app started...");
    console.info("Listening on port "+ applicationHttpPort);
  }).catch((error) => {
    console.error('Unable to initialize application: ', error);
  });
});

// ****************************
// Process shutdown gracefully
// ****************************
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ***********************
// Server shutdown handler
// ***********************
function shutdown(signal) {
  console.log('Shutting down from signal: ', signal);
  ddb.cleanUpNodesData(nodeId).then(() => {
    console.log('Closing server...');
    server.close(() => {
      console.log('Server closed')
    })  
  }).catch((error) => {
    console.error('An error occured while cleaning up application nodes data in DynamoDB: ', error);
  });
}

// **********************
// Default REST handler
// (HTTP GET on /)
// **********************
app.get("/", async (req, res, next) => {
  console.debug('Processing a GET request on / from host '+req.headers['host']);

  // Load all application nodes data from DynamoDB
  ddb.getAllNodesData().then((nodesData) => {

    // Build page content
    res.send(getHTMLContent(nodesData, nodeId));

    // Updater our counters and save new value
    mainPageHitCounter+=1;
    
    ddb.updateNodeData(nodeId, mainPageHitCounter, healthCheckHitCounter);
  }).catch((error) => {
    console.error('An error occured while loading application nodes data from DynamoDB: ', error);
    res.send('An error occured while loading application nodes data from DynamoDB: '+ error.toString());
  })
});

// *****************************************
// Default REST handler for the healthcheck
// (HTTP GET on /healtcheck)
// *****************************************
app.get("/healthcheck", async (req, res, next) => {
  console.debug('Processing a GET request on /healthcheck from host '+req.headers['host']);
  res.send("OK");
  healthCheckHitCounter+=1;
  ddb.updateNodeData(nodeId, mainPageHitCounter, healthCheckHitCounter).catch((error) => {
    console.error('Unable to update application nodes data in DyamoDB', error);
  });
});

// *****************************************
// Returns the HTML content of the main page
// *****************************************
function getHTMLContent(nodes, nodeId) {
  
  const dateLocaleOptions = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false, timeZoneName: 'short'};

  let htmlContent = `<head><style>${getCSSString()}</style></head>`;
  htmlContent = htmlContent + '<body>';
  htmlContent = htmlContent + '<div style="display: inline-block; text-align: center; padding: 20px;"><h1>Greetings from Cluster Sample App!</h1>';
  htmlContent = htmlContent + `<h3>Today is ${new Date().toLocaleString('en-US', dateLocaleOptions)}`+'</h3>';
  htmlContent = htmlContent + `<p>This application node has been hit ${mainPageHitCounter} time(s)</p>`;
  htmlContent = htmlContent + `<p>The healthcheck of this application node has been hit ${healthCheckHitCounter} time(s)</p>`;

  htmlContent = htmlContent + `<div><p>This application cluster is made of ${nodes.length} nodes with the following properties:`;
  // htmlContent = htmlContent + '<table text-align: center; border-style: solid;><th>Name</th><th>Type</th><th>CIDR</th><th>Address</th>';
  htmlContent = htmlContent + '<table text-align: center; border-style: solid;><th>Application Node ID</th><th>#Page Hit</th><th>#Health Check Hit</th><th>IP Addresses</th>';

  nodes.forEach((node) => {
    const elem = JSON.parse(node.IP_ADDRS);
    let ipAddrs = '';
    elem.forEach(ipaddr => {
      ipAddrs = ipAddrs + `${ipaddr.infos.address}\n`
    });
    if(node.NODE_ID === nodeId) {
      htmlContent = htmlContent + `<tr style="background-color: #3fff00;"><td>${node.NODE_ID} (this node)</td><td>${node.PAGE_HIT_COUNT}</td><td>${node.HEALTHCHECK_HIT_COUNT}</td><td>${ipAddrs}</td></tr>`;
    } else {
      htmlContent = htmlContent + `<tr><td>${node.NODE_ID}</td><td>${node.PAGE_HIT_COUNT}</td><td>${node.HEALTHCHECK_HIT_COUNT}</td><td>${ipAddrs}</td></tr>`;  
    }
  });

  htmlContent = htmlContent + '</table></p></div></body>';

  return htmlContent;
}

// Returns the CSS style used on main page
function getCSSString() {
  let css = 'body { text-align: center; font-family:verdana; font-size:12px}';
  css = css + 'table { width: 98%; border: 1px solid black; }';
  css = css + 'th { background-color: #f7a105; color: white; font-family:verdana; font-size:12px}';
  css = css + 'th, td { border: 1px; padding: 3px; text-align: center; }';
  css = css + 'tr:nth-child(even) {background-color: #f2f2f2;}';
  return css;
}

// ***************************************************
// Computes a list of IPv4 addresses seen from the app
// ***************************************************
function getAllIPAddrs() {

  const ipv4Addrs = [];
  const netInterfaces = networkInterfaces();

  for (const interfaceName of Object.keys(netInterfaces)) {
    for (const interfaceDetails of netInterfaces[interfaceName]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (interfaceDetails.family === 'IPv4' && !interfaceDetails.internal) {
        ipv4Addrs.push({interfaceName, infos: interfaceDetails});
      }
    }
  }

  return ipv4Addrs;

}

module.exports = server;
