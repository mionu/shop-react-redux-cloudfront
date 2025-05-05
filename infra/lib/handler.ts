import { getProducts, getProductById } from './products-service';

export async function getProductsList(): Promise<any> {
    const products = await getProducts();

    return {
        body: JSON.stringify(products),
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Headers': 'Content-type',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Origin': '*',
        },
    };
}

export async function getProductsById(event: any) {
    try {
        const product = await getProductById(event.pathParameters?.product_id ?? '');

        return {
            body: JSON.stringify(product),
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
            statusCode: 404,
            headers: {
                'Access-Control-Allow-Headers': 'Content-type',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Origin': '*',
            },
        }
    }
}