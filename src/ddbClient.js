/*
** Cluster Sample Application - DynamoDB Client - https://github.com/aws-samples/cluster-sample-app 
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

let ddbClient = undefined;

function init(awsFactory) {
    ddbClient = new awsFactory.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
}

async function saveNodeData(nodeId, ipv4Addrs, mainPageHitCounter, healthCheckHitCounter) {
    return new Promise(function(resolve, reject) {
        
        const params = {
            TableName: 'CLUSTER_SAMPLE_APP_NODE',
            Item: {
                'NODE_ID' : nodeId.toString(),
                'IP_ADDRS' : JSON.stringify(ipv4Addrs),
                'PAGE_HIT_COUNT': mainPageHitCounter.toString(),
                'HEALTHCHECK_HIT_COUNT': healthCheckHitCounter.toString(),
            }
        };

        // Just for the tests
        if(process.env.NODE_ENV === 'development') {
            resolve({});
        }
        else {
            ddbClient.put(params, function(err, data) {
                if (err) {
                    console.error("Unable to insert application data in DynamoDB: ", err);
                    reject(err);
                } else {
                    console.log("Application data successfully inserted in DynamoDB");
                    resolve(data);
                }
            });    
        }
    });
}

async function cleanUpNodesData(nodeId) {
    return new Promise(function(resolve, reject) {

        const params = {
            TableName: 'CLUSTER_SAMPLE_APP_NODE',
            Key: {
                'NODE_ID' : nodeId.toString()
            }
        };
    
        // Just for the tests
        if(process.env.NODE_ENV === 'development') {
            resolve({});
        }
        else {
            ddbClient.delete(params, function(err, data) {
                if (err) {
                    console.error("Unable to delete application node data", err);
                    reject(err);
                } else {
                    console.log("Successfully deleted application node data");
                    resolve(data);
                }
            });    
        }
    });
}

async function getAllNodesData(nodeId) {
    return new Promise(function(resolve, reject) {

        let params = {
            ExpressionAttributeValues: {
              ':nodeid': {S: '1'}
            },
            FilterExpression: "NODE_ID <> :nodeid",
            TableName: 'CLUSTER_SAMPLE_APP_NODE'
          };
        
        // Just for the tests
        if(process.env.NODE_ENV === 'development') {
            resolve([]);
        }
        else {
            ddbClient.scan(params, function(err, data) {
                if (err) {
                    console.error("Unable to get all node data", err);
                    reject(err);
                } else {
                    resolve(data.Items);
                }
            });    
        }
    });
}

async function updateNodeData(nodeId, mainPageHitCounter, healthCheckHitCounter) {
    return new Promise(function(resolve, reject) {
        
        const params = {
            TableName: 'CLUSTER_SAMPLE_APP_NODE',
            Key: { 'NODE_ID' : nodeId.toString() },
            UpdateExpression: 'set PAGE_HIT_COUNT = :pageHit, HEALTHCHECK_HIT_COUNT = :healthHit',
            ExpressionAttributeValues: {
                ':pageHit' : mainPageHitCounter.toString(),
                ':healthHit' : healthCheckHitCounter.toString()
            }
        };
    
        // Just for the tests
        if(process.env.NODE_ENV === 'development') {
            resolve({});
        }
        else {
            ddbClient.update(params, function(err, data) {
                if (err) {
                    console.error("Unable to update application data in DynamoDB: ", err);
                    reject(err);
                } else {
                    console.log("Application data successfully updated in DynamoDB");
                    resolve(data);
                }
            });    
        }
    });
}
exports.init = init
exports.saveNodeData = saveNodeData
exports.updateNodeData = updateNodeData
exports.cleanUpNodesData = cleanUpNodesData
exports.getAllNodesData = getAllNodesData
