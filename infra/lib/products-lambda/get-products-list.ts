import { getProductsList } from './services/products-service';


export async function main() {
    return  await getProductsList();
}