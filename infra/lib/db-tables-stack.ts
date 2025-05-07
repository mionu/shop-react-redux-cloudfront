import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";

export class DbTablesStack extends Stack {
    private readonly productsTable: dynamodb.Table;
    private readonly stocksTable: dynamodb.Table;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.productsTable = new dynamodb.Table(this, "Products", {
            tableName: 'Products',
            partitionKey: {
                name: "id",
                type: dynamodb.AttributeType.STRING,
            },
        });

        this.stocksTable = new dynamodb.Table(this, "Stocks", {
            tableName: 'Stocks',
            partitionKey: {
                name: "product_id",
                type: dynamodb.AttributeType.STRING,
            },
        });
    }

    public grantWriteData(table: 'Products' | 'Stocks', lambdaFunction: lambda.IFunction) {
        if (table === 'Products') {
            this.productsTable.grantWriteData(lambdaFunction);
        } else {
            this.stocksTable.grantWriteData(lambdaFunction);
        }
    }

    public grantReadData(table: 'Products' | 'Stocks', lambdaFunction: lambda.IFunction) {
        if (table === 'Products') {
            this.productsTable.grantReadData(lambdaFunction);
        } else {
            this.stocksTable.grantReadData(lambdaFunction);
        }
    }
}