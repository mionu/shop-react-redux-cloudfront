import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { aws_s3, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { DbTablesStack } from '../db-tables-stack';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { AuthorizationType } from 'aws-cdk-lib/aws-apigateway';

export class ImportServiceStack extends cdk.Stack {
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
            'ImportBasicAuthorizer',
            {
                handler: authorizerFn,
                identitySource: 'method.request.header.Authorization',
            },
        );

        const uploadBucket = new aws_s3.Bucket(this, 'ProductsImportBucket', {
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ACLS,
            publicReadAccess: true,
            cors: [
                {
                    allowedMethods: [aws_s3.HttpMethods.GET, aws_s3.HttpMethods.PUT],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                    maxAge: 3000,
                },
            ],
        });

        const importProductsFile = new lambda.Function(this, 'importProductsFile', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'handler.importProductsFile',
            code: lambda.Code.fromAsset('dist/products'),
            environment: {
                BUCKET: uploadBucket.bucketName,
            },
        });

        const createProductTopic = new sns.Topic(this, 'createProductTopic');
        createProductTopic.addSubscription(new EmailSubscription('julia_guchik@epam.com'));
        const catalogItemsQueue = new sqs.Queue(
            this,
            'catalogItemsQueue',
        );

        const importFileParser = new lambda.Function(this, 'parseProductsFile', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'handler.parseProductsFile',
            code: lambda.Code.fromAsset('dist/products'),
            environment: {
                BUCKET: uploadBucket.bucketName,
                SQS_QUEUE_URL: catalogItemsQueue.queueUrl,
            },
        });

        uploadBucket.grantPut(importProductsFile);
        uploadBucket.grantPut(importFileParser);
        uploadBucket.grantDelete(importFileParser);
        uploadBucket.addEventNotification(
            aws_s3.EventType.OBJECT_CREATED,
            new LambdaDestination(importFileParser),
            {
                prefix: 'uploaded/',
            },
        );

        const api = new apigateway.RestApi(this, 'import-api', {
            restApiName: 'Import API',
            description: 'This API is used to upload entities to the S3 bucket.',
        });
        const importResource = api.root.addResource('import');
        const importProductsResource = importResource.addResource('products');
        importProductsResource.addCorsPreflight({
            allowOrigins: apigateway.Cors.ALL_ORIGINS,
            allowMethods: apigateway.Cors.ALL_METHODS,
            allowHeaders: ['*'],
        });
        const importIntegration = new apigateway.LambdaIntegration(importProductsFile, {});
        importProductsResource.addMethod('GET', importIntegration, {
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
        });

        const catalogBatchProcess = new lambda.Function(this, 'catalogBatchProcess', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'handler.catalogBatchProcess',
            code: lambda.Code.fromAsset('dist/products'),
            environment: {
                PRODUCTS_TABLE: 'Products',
                SNS_TOPIC_ARN: createProductTopic.topicArn,
            },
        });

        catalogBatchProcess.addEventSource(new SqsEventSource(catalogItemsQueue, {
            batchSize: 5,
        }));
        createProductTopic.grantPublish(catalogBatchProcess);
        catalogItemsQueue.grantSendMessages(importFileParser);
        tables.grantWriteData('Products', catalogBatchProcess);
    }
}