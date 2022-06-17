/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const AWS = require('aws-sdk-mock');
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

describe('Testing sample app', () => {
  let server;
  beforeEach(function () {
    server = require('../src/app');
    
    AWS.mock('DynamoDB.DocumentClient', 'put', function (params, callback){
      callback(null, 'successfully put item in database');
    });
    AWS.mock('DynamoDB.DocumentClient', 'delete', function (params, callback){
      callback(null, 'successfully deleted item in database');
    });
    AWS.mock('DynamoDB.DocumentClient', 'update', function (params, callback){
      callback(null, 'successfully updated item in database');
    });

    const ipaddrs = JSON.stringify([{"infos":{"address":"1.2.3.4"}}]);
    AWS.mock('DynamoDB.DocumentClient', 'scan', { Items: [{ NODE_ID: '1', PAGE_HIT_COUNT: '1', HEALTHCHECK_HIT_COUNT: '1', IP_ADDRS: ipaddrs }]});
  });
  afterEach(function () {
    AWS.restore('DynamoDB.DocumentClient');
    server.close();
  });

  // Better to call the function for this (not go externally through http GET)

  it('Testing default page', (done) => {
    chai.request(server)
        .get('/')
        .end((err, res) => {
            chai.expect(res).to.have.status(200);
            chai.expect(res.text).to.contain('1.2.3.4');
            chai.expect(res.text).to.contain('Greetings from Cluster Sample App!');
          done();
        });
  });

  /*it('Testing healthcheck', (done) => {
    chai.request(server)
        .get('/healthcheck')
        .end((err, res) => {
            chai.expect(res).to.have.status(200);
            chai.expect(res.text).to.equal('OK');
          done();
        });
  });*/

});