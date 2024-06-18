import { sql } from '@vercel/postgres';
import { Product } from '../Entities/Product';
export const fetchCache = 'force-no-store';


class ProductsRepository {
  async getProductById(productId: number): Promise<Product | undefined> {
    try {
      const query = await sql<Product>`SELECT * FROM products WHERE id = ${productId}`;
      return query.rows[0];
    } catch (error) {
      console.error(`Failed to fetch product with ID ${productId}:`, error);
      throw new Error(`Failed to fetch product with ID ${productId}.`);
    }
  }

  async createProduct(data:{
    productName: string, 
    description: string, 
    imageURL: string, 
    imageKey: string, 
    price: number, 
    stock: number
  }
  ): Promise<number> {
    try {
      const {productName, description, imageURL, price, imageKey, stock} = data
      const query = await sql`
        INSERT INTO products (productName, description, imageURL, imageKey, price, stock) 
        VALUES (${productName}, ${description}, ${imageURL}, ${imageKey}, ${price}, ${stock}) 
        RETURNING id
      `;
      return query.rows[0].id;
    } catch (error) {
      console.error('Failed to create product:', error);
      throw new Error('Failed to create product.');
    }
  }

  async updateProduct(
    productId: string, 
    productName: string, 
    description: string, 
    imageURL: string, 
    imageKey: string, 
    price: number, 
    stock: number
  ): Promise<void> {
    try {
      await sql`
        UPDATE products 
        SET productName = ${productName}, description = ${description}, imageURL = ${imageURL}, imageKey = ${imageKey}, price = ${price}, stock = ${stock} 
        WHERE id = ${productId}
      `;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw new Error('Failed to update product.');
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      await sql`
        DELETE FROM products 
        WHERE id = ${productId}
      `;
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw new Error('Failed to delete product.');
    }
  }

  async getAllProducts(): Promise<Product[]> {
    try {
      const query = await sql<Product>`SELECT * FROM products`;
      return query.rows;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw new Error('Failed to fetch products.');
    }
  }

  async getAllProductsPaginated(
    page: number,
    pageSize: number
  ): Promise<{products:Product[], total:number}> {
    try {
      const offset = (page - 1) * pageSize;
  
      const query = await sql<Product>
        `SELECT * FROM products 
        ORDER BY productName
        LIMIT ${pageSize} OFFSET ${offset}`;

      const totalQuery = await sql<{ count: number }>`
      SELECT COUNT(*) as count FROM products`;
      const total = totalQuery.rows[0].count;
      
      return {
        products:query.rows,
        total
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw new Error('Failed to fetch products.');
    }
  }

  async searchProductsByName(
    productName: string,
    page: number,
    pageSize: number,
  ): Promise<{products:Product[], total:number}> {
    try {
      const offset = (page - 1) * pageSize;
  
      // Query to get the total count of matching products
      const totalQuery = await sql<{ count: number }>`
        SELECT COUNT(*) as count FROM products WHERE productName ILIKE ${'%' + productName + '%'}
      `;
      const total = totalQuery.rows[0].count;
  
      // Query to get the paginated products
      const query = await sql<Product>`
        SELECT * FROM products
        WHERE productName ILIKE ${'%' + productName + '%'}
        ORDER BY productName
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      return {
        products: query.rows,
        total: total,
      };
    } catch (error) {
      console.error(`Failed to fetch products with name matching "${productName}":`, error);
      throw new Error(`Failed to fetch products with name matching "${productName}".`);
    }
  }

}

export default ProductsRepository;
