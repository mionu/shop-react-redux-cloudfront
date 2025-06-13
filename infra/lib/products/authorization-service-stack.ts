import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { config } from 'dotenv';

config();

export class AuthServiceStack extends cdk.Stack {
    private readonly basicAuthorizer: lambda.Function;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const users = this.getUsers(process.env.USERS!);

        this.basicAuthorizer = new lambda.Function(this, 'basicAuthorizer', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'handler.authorize',
            code: lambda.Code.fromAsset('dist/products'),
            environment: { ...users },
        });
    }

    public getAuthorizerArn(): string {
        return this.basicAuthorizer.functionArn;
    }

    private getUsers(users: string): Record<string, string> {
        if (!users) {
            throw new Error('USERS environment variable is not set');
        }

        return users.split(',').reduce((acc, user) => {
            const [username, password] = user.split('=');
            if (!username || !password) {
                throw new Error(`Invalid user format: ${user}`);
            }
            acc[username] = password;
            return acc;
        }, {} as Record<string, string>);
    }
}