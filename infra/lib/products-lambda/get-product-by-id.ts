import { getProductById } from './services/products-service';

export async function main(event: any, _context: any, callback: any) {
    try {
        const id = event?.product_id;
        return await getProductById(id);
    } catch (error) {
        callback(error);
        return error;
    }
}