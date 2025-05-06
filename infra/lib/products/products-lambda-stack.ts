import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import { DbTablesStack } from '../db-tables-stack';

export class ProductsLambdaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, tables: DbTablesStack) {
        super(scope, id);

        const getProductsList = new lambda.Function(this, 'getProductsList', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'handler.getProductsList',
            code: lambda.Code.fromAsset(path.join(__dirname, './')),
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
            code: lambda.Code.fromAsset(path.join(__dirname, './')),
            environment: {
                PRODUCTS_TABLE: 'Products',
            },
        });

        const getProductsById = new lambda.Function(this, 'getProductsById', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'handler.getProductsById',
            code: lambda.Code.fromAsset(path.join(__dirname, './')),
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

        const productsResource = api.root.addResource('products');
        productsResource.addMethod('GET', productListIntegration);
        productsResource.addMethod('POST', createProductIntegration);

        const productByIdResource = productsResource.addResource('{product_id}')
        productByIdResource.addMethod('GET', getProductsByIdIntegration);

        tables.grantReadData('Products', getProductsList);
        tables.grantReadData('Stocks', getProductsList);
        tables.grantReadData('Products', getProductsById);
        tables.grantReadData('Stocks', getProductsById);
        tables.grantWriteData('Products', createProduct);
    }
}