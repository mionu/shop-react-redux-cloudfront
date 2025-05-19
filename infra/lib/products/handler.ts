import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import {
    ProductsService,
} from './products-service';

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
    };
}

export async function parseProductsFile(event: any) {
    return {
        statusCode: 200,
        body: `parseProductsFile ${process.env.BUCKET}`,
    };
}