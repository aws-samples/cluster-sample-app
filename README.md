![Continuous Integration](https://github.com/aws-samples/cluster-sample-app/actions/workflows/ci.yml/badge.svg)
[![license](https://img.shields.io/badge/license-MIT-green)](https://github.com/aws-samples/cluster-sample-app/blob/main/LICENSE)
## Cluster Sample Application
A very basic web application written in Javascript and packaged as a Docker image to be used as a demo when testing clustered deployments.

The application default page displays current date, time as well as the current IP addresses of the current application node.

## Preliminary comments

This demo application is not production ready. It is only intended for demo and learning purposes.

The Application Load Balancer created by the CloudFormation template is externally facing and publicly available without any restrictions.

In order to add HTTPS support to this load balancer, you may take the steps described in the following documentation:
- https://docs.aws.amazon.com/elasticloadbalancing/latest/application/create-https-listener.html


## Prerequisites

The following are prequisites:
- an AWS Account
- Node.js (v14) with npm installed
- Docker installed

Use the following command to install the project dependencies:
```
npm install
```

## Creating your ECR repository

To create a private repository for your docker image you can take the following steps:
1. Navigate to your AWS console and open the ECR service console
2. Click on "Repositories" and "Create repository"
3. For the repository name, use "cluster-sample-app"
4. For all others settings, you can use defaults
5. You can then click on "Create repository"


## Building, tagging and pushing your docker image to your ECR repository

To build, tag and push your docker image, take the following steps:
1. Navigate to your AWS console and open the ECR service console
2. Select your repository and click "View push commands"
3. Use the commands listed to build, tag and push your docker image

## Deploying your application stack with CloudForamtion

To deploy your application stack using the provided CloudFormation template, take the following step:
1. Navigate to your AWS console and open the CloudFormation service console
2. Click on "Create stack (with new resources)"
3. In the template section, click "Upload a template file"
4. Choose the local file "cluster-sample-app-stack.yml" as the CloudFormation template and click "Next"
5. Enter a name for your stack
6. Select two existing subnets (SubnetA and SubnetB) from an existing VPC
7. Select an existing VPC and click "Next"
8. Keep all default options and click "Next"
9. Review all options, acknowledge the creation of IAM resources and click "Create stack"

Once your application stack is deployed, click on the "Output" tab, copy the URL and open it into your browser to access the application.

## Deploying your application stack with AWS Co-Pilot (Optional)

If you choose to deploy your application using AWS Co-Pilot with the required add-on resources for AWS DynamoDB, take the following steps:
1. Open a terminal window on your local machine.
2. Run the following command to clone the repository and navigate to the project root directory:

```
git clone https://github.com/aws-samples/cluster-sample-app sample-app && cd sample-app

```

3. Deploy the application with one comman using the following command in the root directory of your project: 

```
copilot init --app cluster --name sample-app --type "Load Balanced Web Service" --dockerfile ./Dockerfile --port 8080 --deploy

``` 

4. Copy the existing AWS Add-ons directory (./copilot/demo/addons), and paste it under the newly created copilot/sample-app directory (./copilot/sample-app/) to add DynamoDB and the required permissions for the application's storage.

5. From the the root directory of your project, open the Copilot application manifest file (./copilot/sample-app/manifest.yml) and change the http.healthcheck property to “/healthcheck”

6. Deploy your changes to your test environment using the following command in the root directory of your project:

```
copilot svc deploy test

```

7. Once testing is complete the application and test environment can be removed with the following command:

```
copilot app delete --yes

```

8. You should then be able to access the application on the DNS name provided as output.

## License

This sample application is licensed under [the MIT-0 License](https://github.com/aws/mit-0).
