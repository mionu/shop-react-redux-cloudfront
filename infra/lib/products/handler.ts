import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    CopyObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import {
    ProductsService,
} from './products-service';
import {
    APIGatewayAuthorizerResult,
    APIGatewayTokenAuthorizerEvent,
    S3Event,
    SQSEvent,
} from 'aws-lambda';
import { Readable } from 'node:stream';
import * as csvParser from 'csv-parser';

const productsService = new ProductsService({
    PRODUCTS_TABLE: process.env.PRODUCTS_TABLE!,
    STOCKS_TABLE: process.env.STOCKS_TABLE!,
});

export async function getProductsList(): Promise<any> {
    try {
        const products = await productsService.getProducts();

        return {
            body: JSON.stringify(products),
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Headers': 'Content-type',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Origin': '*',
            },
        };
    } catch (error) {
        return {
            body: JSON.stringify(error),
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Headers': 'Content-type',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Origin': '*',
            },
        }
    }


}

export async function getProductsById(event: any) {
    try {
        const product = await productsService.getProductById(event.pathParameters?.product_id ?? '');

        return {
            body: JSON.stringify(product),
            statusCode: product ? 200 : 404,
            headers: {
                'Access-Control-Allow-Headers': 'Content-type',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Origin': '*',
            },
        };
    } catch (error) {
        return {
            body: JSON.stringify(error),
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Headers': 'Content-type',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Origin': '*',
            },
        }
    }
}

export async function createProduct(event: any) {
    try {
        const product = JSON.parse(event.body);
        const createdProduct = await productsService.createProduct(product);

        return {
            body: JSON.stringify(createdProduct),
            statusCode: 201,
            headers: {
                'Access-Control-Allow-Headers': 'Content-type',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Origin': '*',
            },
        };
    } catch (error: any) {
        return {
            body: JSON.stringify({ error: error?.toString() }),
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Headers': 'Content-type',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Origin': '*',
            },
        }
    }
}

export async function importProductsFile(event: any) {
    const bucketName = process.env.BUCKET!;
    const fileName = event.queryStringParameters?.name;

    if (!fileName) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'File name is required',
            }),
            headers: {
                'Access-Control-Allow-Headers': 'Content-type',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Origin': '*',
            },
        }
    }

    const s3 = new S3Client({ region: process.env.AWS_REGION });
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: `uploaded/${fileName}`,
        ContentType: 'text/csv',
    });
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return {
        statusCode: 200,
        body: JSON.stringify({
            url: signedUrl,
        }),
        headers: {
            'Access-Control-Allow-Headers': 'Content-type',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Origin': '*',
        },
    };
}

export async function parseProductsFile(event: S3Event) {
    const s3Client = new S3Client([{
        region: process.env.AWS_REGION,
    }]);
    const sqsClient = new SQSClient([{
        region: process.env.AWS_REGION,
    }]);

    for (const file of event.Records) {
        const bucket = file.s3.bucket.name;
        const key = decodeURIComponent(file.s3.object.key.replace(/\+/g, ' '));

        console.log('Processing file: ', bucket, key);

        try {
            const getCommand = new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            });
            const { Body } = await s3Client.send(getCommand);
            const parsedProducts = await new Promise<any[]>((resolve, reject) => {
                const products: any[] = [];
                (Body as Readable)
                    .pipe(csvParser())
                    .on('data', (row) => {
                        console.log('Row: ', row);
                        products.push(row);
                    })
                    .on('end', async () => {
                        console.log('CSV file successfully processed')
                        resolve(products);
                    })
                    .on('error', (error) => {
                        console.error('Error: ', error);
                        reject(error);
                    });
            });
            const sqsEntries = new SendMessageBatchCommand({
                Entries: parsedProducts.map((product, index) => ({
                    Id: index + '',
                    MessageBody: JSON.stringify(product),
                })),
                QueueUrl: process.env.SQS_QUEUE_URL,
            });
            await sqsClient.send(sqsEntries);
            console.log('Products sent to SQS queue');

            console.log('Copying file to parsed folder');
            const fileName = key.split('/').pop();
            const copyCommand = new CopyObjectCommand({
                Bucket: bucket,
                CopySource: `${bucket}/${key}`,
                Key: `parsed/${fileName}`,
            });
            await s3Client.send(copyCommand);
            console.log(`${fileName} copied to parsed folder`);

            const deleteCommand = new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            });
            await s3Client.send(deleteCommand);
            console.log(`${fileName} deleted from uploaded folder`);
        } catch (error) {
            console.error('Error: ', error);
        }
    }
}

export async function catalogBatchProcess(event: SQSEvent) {
    try {
        const snsClient = new SNSClient([{
            region: process.env.AWS_REGION!,
        }]);
        const titles = [];

        for (const record of event.Records) {
            try {
                const product = JSON.parse(record.body);
                console.log('Processing product: ', product);

                const newProduct = await productsService.createProduct(product);
                console.log('Product created: ', newProduct);
                titles.push(newProduct.title);
            } catch (error) {
                console.error('Error: ', error);
            }
        }

        const publishCommand = new PublishCommand({
            TopicArn: process.env.SNS_TOPIC_ARN!,
            Message: `Products with the following titles have been successfully processed: ${titles.join(', ')}`,
        });
        await snsClient.send(publishCommand);
    } catch (error) {
        console.error('Error in catalogBatchProcess: ', error);
    }
}

export async function authorize(event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> {
    console.log('Event: ', JSON.stringify(event, null, 2));
    try {
        const token = event.authorizationToken;

        if (!token || !token.startsWith('Basic ')) {
            throw new Error('Unauthorized');
        }

        // Decode the Basic Authorization token
        const base64Credentials = token.split(' ')[1];
        const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, password] = decodedCredentials.split(':');

        if (!username || !password) {
            throw new Error('Unauthorized');
        }

        // Validate credentials against environment variables
        const expectedPassword = process.env[username];
        if (expectedPassword !== password) {
            throw new Error('Access Denied');
        }

        console.log('Access Granted: Valid credentials provided');
        return {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: event.methodArn,
                    },
                ],
            },
        };
    } catch (error) {
        console.log('Access Denied: ', error);
        return {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Deny',
                        Resource: event.methodArn,
                    },
                ],
            },
        };
    }
}