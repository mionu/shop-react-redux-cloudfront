import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import { DbTablesStack } from '../db-tables-stack';

export class SeedTablesStack extends cdk.Stack {
    constructor(scope: Construct, id: string, tables: DbTablesStack) {
        super(scope, id);

        const seedTables = new lambda.Function(this, 'seedTables', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'handler.main',
            code: lambda.Code.fromAsset(path.join(__dirname, './')),
            environment: {
                PRODUCTS_TABLE: 'Products',
                STOCKS_TABLE: 'Stocks',
            },
        });

        tables.grantWriteData('Products', seedTables);
        tables.grantWriteData('Stocks', seedTables);
    }
}