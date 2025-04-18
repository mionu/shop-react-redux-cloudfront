import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import { Cors } from 'aws-cdk-lib/aws-apigateway';

export class ProductsLambdaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const getProductsList = new lambda.Function(this, 'getProductsList', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'get-products-list.main',
            code: lambda.Code.fromAsset(path.join(__dirname, './')),
        });

        const getProductsById = new lambda.Function(this, 'getProductsById', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'get-product-by-id.main',
            code: lambda.Code.fromAsset(path.join(__dirname, './')),
        });

        const api = new apigateway.RestApi(this, 'products-api', {
            restApiName: 'Products API',
            description: 'This API serves the Lambda functions.',
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowMethods: Cors.ALL_METHODS,
                allowHeaders: ['*'],
            }
        });


        const productListIntegration = new apigateway.LambdaIntegration(getProductsList, {
            integrationResponses: [
                {
                    statusCode: '200',
                    // responseParameters: {
                    //     'integration.response.header.Access-Control-Allow-Headers': "'*'",
                    //     'integration.response.header.Access-Control-Allow-Origin': "'*'",
                    //     'integration.response.header.Access-Control-Allow-Methods': "'*'",
                    // },
                },
            ],
            proxy: false,
        });

        const getProductsByIdIntegration = new apigateway.LambdaIntegration(getProductsById, {
            requestTemplates: {
                'application/json': '{ "product_id": "$input.params(\'product_id\')" }',
            },
            integrationResponses: [
                {
                    statusCode: '200',
                },
            ],
            proxy: false,
        });

        const productsResource = api.root.addResource('products');
        productsResource.addMethod('GET', productListIntegration, {
            methodResponses: [{
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': true,
                    'method.response.header.Access-Control-Allow-Origin': true,
                    'method.response.header.Access-Control-Allow-Methods': true,
                },
            }],
        });
        const productByIdResource = productsResource.addResource('{product_id}')
        productByIdResource.addMethod('GET', getProductsByIdIntegration, {
            methodResponses: [
                {
                    statusCode: '200',
                },
                {
                    statusCode: '404',
                }
            ],
        });
    }
}