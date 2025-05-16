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