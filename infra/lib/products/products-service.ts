import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Product } from './product';

export class ProductsService {
    private readonly dynamoDB: DynamoDBClient;
    private readonly client: DynamoDBDocumentClient;
    private readonly tables: Record<string, string>;

    constructor(tables: Record<string, string>) {
        this.dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
        this.client = DynamoDBDocumentClient.from(this.dynamoDB);
        this.tables = tables;
    }

    async getProducts(): Promise<Product[]> {
        const productsCommand = new ScanCommand({
            TableName: this.tables.PRODUCTS_TABLE,
        });
        const stocksCommand = new ScanCommand({
            TableName: this.tables.STOCKS_TABLE,
        });

        const products = await this.client.send(productsCommand);
        const stocks = await this.client.send(stocksCommand);
        const idsToStocks = (stocks?.Items ?? []).reduce((mapping, stock) => {
            const productId = stock.product_id;
            mapping[productId] = stock.count;
            return mapping;
        }, {});
        return ((products?.Items ?? []) as Product[]).map(product => ({
            ...product,
            count: idsToStocks[product.id] ?? 0,
        }));
    }

    async getProductById(id: string): Promise<Product | null> {
        const productCommand = new GetCommand({
            TableName: this.tables.PRODUCTS_TABLE,
            Key: { id },
        });
        const stockCommand = new GetCommand({
            TableName: this.tables.STOCKS_TABLE,
            Key: { product_id: id },
        });

        try {
            const product = await this.client.send(productCommand);
            const stock = await this.client.send(stockCommand);
            if (product?.Item) {
                return {
                    ...product.Item,
                    count: stock?.Item?.count ?? 0,
                } as Product;
            }
            return null;
        } catch (error) {
            return null;
        }
    }
}