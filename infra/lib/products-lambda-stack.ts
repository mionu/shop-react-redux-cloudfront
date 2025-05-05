import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';

export class ProductsLambdaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const getProductsList = new lambda.Function(this, 'getProductsList', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'handler.getProductsList',
            code: lambda.Code.fromAsset(path.join(__dirname, './')),
        });

        const getProductsById = new lambda.Function(this, 'getProductsById', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'handler.getProductsById',
            code: lambda.Code.fromAsset(path.join(__dirname, './')),
        });

        const api = new apigateway.RestApi(this, 'products-api', {
            restApiName: 'Products API',
            description: 'This API serves the Lambda functions.',
        });

        const productListIntegration = new apigateway.LambdaIntegration(getProductsList, {});
        const getProductsByIdIntegration = new apigateway.LambdaIntegration(getProductsById, {});

        const productsResource = api.root.addResource('products');
        productsResource.addMethod('GET', productListIntegration);

        const productByIdResource = productsResource.addResource('{product_id}')
        productByIdResource.addMethod('GET', getProductsByIdIntegration);
    }
}