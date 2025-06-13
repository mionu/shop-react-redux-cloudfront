import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { AuthorizationType } from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DbTablesStack } from '../db-tables-stack';

export class ProductsLambdaStack extends cdk.Stack {
    private readonly authorizer: apigateway.TokenAuthorizer;

    constructor(scope: Construct, id: string, { tables, authArn }: { tables: DbTablesStack, authArn: string }) {
        super(scope, id);

        const authorizerFn = lambda.Function.fromFunctionAttributes(
            this,
            'BasicAuthorizerLambda',
            {
                functionArn: authArn,
                sameEnvironment: true,
            },
        );

        this.authorizer = new apigateway.TokenAuthorizer(
            this,
            'ProductsBasicAuthorizer',
            {
                handler: authorizerFn,
                identitySource: 'method.request.header.Authorization',
            },
        );

        const getProductsList = new lambda.Function(this, 'getProductsList', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'handler.getProductsList',
            code: lambda.Code.fromAsset('dist/products'),
            environment: {
                PRODUCTS_TABLE: 'Products',
                STOCKS_TABLE: 'Stocks',
            },
        });

        const createProduct = new lambda.Function(this, 'createProduct', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'handler.createProduct',
            code: lambda.Code.fromAsset('dist/products'),
            environment: {
                PRODUCTS_TABLE: 'Products',
            },
        });

        const getProductsById = new lambda.Function(this, 'getProductsById', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'handler.getProductsById',
            code: lambda.Code.fromAsset('dist/products'),
            environment: {
                PRODUCTS_TABLE: 'Products',
                STOCKS_TABLE: 'Stocks',
            },
        });

        const api = new apigateway.RestApi(this, 'products-api', {
            restApiName: 'Products API',
            description: 'This API serves the Lambda functions.',
        });

        const productListIntegration = new apigateway.LambdaIntegration(getProductsList, {});
        const createProductIntegration = new apigateway.LambdaIntegration(createProduct, {});
        const getProductsByIdIntegration = new apigateway.LambdaIntegration(getProductsById, {});
        const authOptions = {
            authorizationType: AuthorizationType.CUSTOM,
            authorizer: this.authorizer,
            methodResponses: ['200', '404', '500'].map(status => ({
                statusCode: status,
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Origin': true,
                    'method.response.header.Access-Control-Allow-Methods': true,
                    'method.response.header.Access-Control-Allow-Headers': true,
                },
            })),
        };

        const productsResource = api.root.addResource('products');
        productsResource.addCorsPreflight({
            allowOrigins: apigateway.Cors.ALL_ORIGINS,
            allowMethods: apigateway.Cors.ALL_METHODS,
            allowHeaders: ['*'],
        });
        productsResource.addMethod('GET', productListIntegration, authOptions);
        productsResource.addMethod('POST', createProductIntegration, authOptions);

        const productByIdResource = productsResource.addResource('{product_id}')
        productByIdResource.addMethod('GET', getProductsByIdIntegration, authOptions);

        tables.grantReadData('Products', getProductsList);
        tables.grantReadData('Stocks', getProductsList);
        tables.grantReadData('Products', getProductsById);
        tables.grantReadData('Stocks', getProductsById);
        tables.grantWriteData('Products', createProduct);
    }
}