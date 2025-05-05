import { Handler } from 'aws-lambda';
import {
    BatchWriteItemCommand,
    DynamoDBClient,
    WriteRequest,
} from '@aws-sdk/client-dynamodb';

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });

const ProductsList: Record<string, any>[] = [
    { title: 'Wireless Headphones', description: 'High-quality over-ear headphones with noise cancellation.', price: 99.99, imageUrl: 'https://example.com/headphones.jpg' },
    { title: 'Smartphone Stand', description: 'Adjustable stand for smartphones and tablets.', price: 14.99, imageUrl: 'https://example.com/stand.jpg' },
    { title: 'Bluetooth Speaker', description: 'Portable speaker with excellent sound quality.', price: 49.99, imageUrl: 'https://example.com/speaker.jpg' },
    { title: 'Fitness Tracker', description: 'Track your steps, heart rate, and sleep patterns.', price: 59.99, imageUrl: 'https://example.com/fitness-tracker.jpg' },
    { title: 'Laptop Backpack', description: 'Durable backpack with multiple compartments for laptops and accessories.', price: 39.99, imageUrl: 'https://example.com/backpack.jpg' },
    { title: 'Wireless Mouse', description: 'Ergonomic mouse with adjustable DPI settings.', price: 19.99, imageUrl: 'https://example.com/mouse.jpg' },
    { title: 'Gaming Keyboard', description: 'Mechanical keyboard with customizable RGB lighting.', price: 89.99, imageUrl: 'https://example.com/keyboard.jpg' },
    { title: 'USB-C Hub', description: 'Multi-port hub for USB-C devices with HDMI and USB 3.0 support.', price: 29.99, imageUrl: 'https://example.com/hub.jpg' },
    { title: 'Action Camera', description: 'Compact camera for capturing high-definition videos and photos.', price: 129.99, imageUrl: 'https://example.com/camera.jpg' },
    { title: 'Electric Kettle', description: 'Fast-boiling kettle with temperature control.', price: 24.99, imageUrl: 'https://example.com/kettle.jpg' },
];

export const main: Handler = async () => {
    const products: Record<string, any>[] = ProductsList.map(product => ({
        ...product,
        id: crypto.randomUUID(),
    }));
    const stocks: Record<string, any>[] = products.map(({ id }) => ({
        product_id: id,
        count: Math.ceil(Math.random() * 100),

    }));
    const productCommands: WriteRequest[] = products.map(product => ({
        PutRequest: {
            Item: {
                id: { S: product.id },
                title: { S: product.title },
                description: { S: product.description },
                price: { N: product.price + '' },
                imageUrl: { S: product.imageUrl },
            },
        },
    }));
    const stockCommands: WriteRequest[] = stocks.map(stock => ({
        PutRequest: {
            Item: {
                product_id: { S: stock.product_id },
                count: { N: stock.count + '' },

            },
        },
    }));

    const command = new BatchWriteItemCommand({
        RequestItems: {
            [process.env.PRODUCTS_TABLE as string]: productCommands,
            [process.env.STOCKS_TABLE as string]: stockCommands,
        }
    });

    try {
        const res = await dynamoDB.send(command);

        return { message: 'Seed successful', command, res };
    } catch (error) {
        return { error, command };
    }
};