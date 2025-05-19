import * as cdk from 'aws-cdk-lib';
import { aws_s3, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';

export class ImportServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const uploadBucket = new aws_s3.Bucket(this, 'ProductsImportBucket', {
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ACLS,
            publicReadAccess: true,
        });

        const importProductsFile = new lambda.Function(this, 'importProductsFile', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'handler.importProductsFile',
            code: lambda.Code.fromAsset(path.join(__dirname, './')),
            environment: {
                BUCKET: uploadBucket.bucketName,
            },
        });
        const importFileParser = new lambda.Function(this, 'parseProductsFile', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'handler.parseProductsFile',
            code: lambda.Code.fromAsset(path.join(__dirname, './')),
            environment: {
                BUCKET: uploadBucket.bucketName,
            },
        });

        uploadBucket.grantPut(importProductsFile);
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
        const importIntegration = new apigateway.LambdaIntegration(importProductsFile, {});
        importProductsResource.addMethod('GET', importIntegration);
    }
}