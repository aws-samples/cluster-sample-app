/*
** Cluster Sample Application - https://github.com/aws-samples/cluster-sample-app 
© 2022 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.

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
const fs = require('fs');
const { networkInterfaces } = require('os');
const awsFactory = require('aws-sdk');
const ddb = require('./ddbClient.js');

let nodeId = undefined;
let homePageTemplate = undefined;
const app = express();
const applicationHttpPort = process.env.CLUSTER_SAMPLE_APP_PORT || 3000;
const currentAWSRegion = process.env.AWS_REGION || 'eu-west-3'

awsFactory.config.update({region: currentAWSRegion});

let mainPageHitCounter = 1;
let healthCheckHitCounter = 0;

// ***********************
// Application initializer
// ***********************
let server = app.listen(applicationHttpPort, () => {

  // Load home page template
  try {
    homePageTemplate = fs.readFileSync('./home.html', 'utf8')
  } catch (err) {
    homePageTemplate = `<p>Unable to load page template</p><p>${error}</p>`;
    console.error(err);
  }

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
async function shutdown(signal) {
  console.log('Shutting down from signal: ', signal);
  try {
    await ddb.cleanUpNodesData(nodeId);
    server.close(() => {
      console.log('Server closed');
    })
  }
  catch(error) {
    console.error('An unexpected error occured while cleaning up application nodes data: ', error);
    console.log('Closing server...');
    server.close(() => {
      console.log('Server closed');
    }) 
  }  
}

// **********************
// Default REST handler
// (HTTP GET on /)
// **********************
app.get("/", async (req, res, next) => {
  console.debug('Processing a GET request on / from host '+req.headers['host']);
  const content = await generateHomePage();
  res.send(content);
});

// *****************************************
// Default REST handler for the healthcheck
// (HTTP GET on /healtcheck)
// *****************************************
app.get("/healthcheck", async (req, res, next) => {
  console.debug('Processing a GET request on /healthcheck from host '+req.headers['host']);
  try {
    healthCheckHitCounter+=1;
    await ddb.updateNodeData(nodeId, mainPageHitCounter, healthCheckHitCounter);
    res.send("OK");
  }
  catch(error) {
    console.error('Unable to update application nodes data in DyamoDB', error);
    res.send("NOK");
  }
});

// ***************************
// Generate home page content
// ***************************
async function generateHomePage() {
  try {
    // Update our counters and save new value
    mainPageHitCounter+=1;
    await ddb.updateNodeData(nodeId, mainPageHitCounter, healthCheckHitCounter);

    // Load all application nodes data from DynamoDB
    const nodesData = await ddb.getAllNodesData();

    // Build page content
    return getHTMLContent(nodesData, nodeId);
  }
  catch(error) {
    console.error('An error occured while loading application nodes data from DynamoDB: ', error);
    return ('<p>An error occured while loading application nodes data from DynamoDB: '+ error.toString()+'</p>');
  }
}

// *****************************************
// Returns the HTML content of the main page
// *****************************************
function getHTMLContent(nodes, nodeId) {
  const dateLocaleOptions = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false, timeZoneName: 'short'};

  let htmlContent = homePageTemplate.replace('$TodayDate', new Date().toLocaleString('en-US', dateLocaleOptions));
  htmlContent = htmlContent.replace('$mainPageHitCounter', mainPageHitCounter);
  htmlContent = htmlContent.replace('$healthCheckHitCounter', healthCheckHitCounter);
  htmlContent = htmlContent.replace('$nodes', nodes.length);
  htmlContent = htmlContent.replace('$tableLines', getAppNodeHTMLString(nodes));

  return htmlContent;
}

// ********************************************
// Returns the HTML table row for each app node
// ********************************************
function getAppNodeHTMLString(nodes) {
  let htmlContent = '';
  try {
    nodes.forEach((node) => {
      const elem = JSON.parse(node.IP_ADDRS);
      let ipAddrs = '';
      elem.forEach(ipaddr => {
        ipAddrs = ipAddrs + `${ipaddr.infos.address}`+'<br/>'
      });
      if(node.NODE_ID === nodeId) {
        htmlContent = htmlContent + `<tr style="background-color: #3fff00;"><td>${node.NODE_ID} (this node)</td><td>${node.PAGE_HIT_COUNT}</td><td>${node.HEALTHCHECK_HIT_COUNT}</td><td>${ipAddrs}</td></tr>`;
      } else {
        htmlContent = htmlContent + `<tr><td>${node.NODE_ID}</td><td>${node.PAGE_HIT_COUNT}</td><td>${node.HEALTHCHECK_HIT_COUNT}</td><td>${ipAddrs}</td></tr>`;  
      }
    });
  }
  catch(error) {
    htmlContent = `<p>Unable to build node data (${error})</p>`;
  }

  return htmlContent;
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
