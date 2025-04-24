import { Product } from './product';

const ProductsList: Product[] = [
    { id: '1', title: 'Wireless Headphones', description: 'High-quality over-ear headphones with noise cancellation.', price: 99.99, imageUrl: 'https://example.com/headphones.jpg', count: 50 },
    { id: '2', title: 'Smartphone Stand', description: 'Adjustable stand for smartphones and tablets.', price: 14.99, imageUrl: 'https://example.com/stand.jpg', count: 120 },
    { id: '3', title: 'Bluetooth Speaker', description: 'Portable speaker with excellent sound quality.', price: 49.99, imageUrl: 'https://example.com/speaker.jpg', count: 80 },
    { id: '4', title: 'Fitness Tracker', description: 'Track your steps, heart rate, and sleep patterns.', price: 59.99, imageUrl: 'https://example.com/fitness-tracker.jpg', count: 100 },
    { id: '5', title: 'Laptop Backpack', description: 'Durable backpack with multiple compartments for laptops and accessories.', price: 39.99, imageUrl: 'https://example.com/backpack.jpg', count: 70 },
    { id: '6', title: 'Wireless Mouse', description: 'Ergonomic mouse with adjustable DPI settings.', price: 19.99, imageUrl: 'https://example.com/mouse.jpg', count: 150 },
    { id: '7', title: 'Gaming Keyboard', description: 'Mechanical keyboard with customizable RGB lighting.', price: 89.99, imageUrl: 'https://example.com/keyboard.jpg', count: 60 },
    { id: '8', title: 'USB-C Hub', description: 'Multi-port hub for USB-C devices with HDMI and USB 3.0 support.', price: 29.99, imageUrl: 'https://example.com/hub.jpg', count: 90 },
    { id: '9', title: 'Action Camera', description: 'Compact camera for capturing high-definition videos and photos.', price: 129.99, imageUrl: 'https://example.com/camera.jpg', count: 40 },
    { id: '10', title: 'Electric Kettle', description: 'Fast-boiling kettle with temperature control.', price: 24.99, imageUrl: 'https://example.com/kettle.jpg', count: 110 },
];

export const getProducts = async (): Promise<Product[]> => {
    return ProductsList;
};

export const getProductById = async (id: string): Promise<Product> => {
    const product = ProductsList.find(product => product.id === id);
    if (!product) {
        throw new Error('Product not found');
    }
    return product;
}