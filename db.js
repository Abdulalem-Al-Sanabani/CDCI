const { randomUUID } = require('crypto');
const mysql = require('mysql2/promise');

const defaultRecipes = [
  {
    id: randomUUID(),
    title: 'Citrus Herb Salmon',
    author: 'Mina',
    category: 'Dinner',
    time: '25 min',
    description: 'Roasted salmon with lemon, dill, and a quick fennel salad.',
    ingredients: [
      '2 salmon fillets',
      '1 lemon',
      'Fresh dill',
      '1 fennel bulb',
      'Olive oil'
    ],
    accent: 'sunrise'
  },
  {
    id: randomUUID(),
    title: 'Cardamom Berry Toast',
    author: 'Rafi',
    category: 'Breakfast',
    time: '10 min',
    description: 'Mascarpone toast with crushed berries, honey, and cardamom.',
    ingredients: [
      'Sourdough bread',
      'Mascarpone',
      'Mixed berries',
      'Honey',
      'Cardamom'
    ],
    accent: 'berry'
  },
  {
    id: randomUUID(),
    title: 'Smoky Chickpea Bowl',
    author: 'Lina',
    category: 'Lunch',
    time: '20 min',
    description: 'Warm grains, crispy chickpeas, yogurt sauce, and charred greens.',
    ingredients: [
      'Cooked farro',
      'Chickpeas',
      'Greek yogurt',
      'Spinach',
      'Smoked paprika'
    ],
    accent: 'forest'
  }
];

const accentCycle = ['sunrise', 'berry', 'forest', 'ocean'];

function createPoolConfig() {
  const connectionUri = process.env.MYSQL_URL || process.env.DATABASE_URL;

  if (connectionUri) {
    return {
      uri: connectionUri,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true
    };
  }

  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'recipes',
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true
  };
}

const pool = mysql.createPool(createPoolConfig());

async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recipes (
      id CHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      time VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      accent VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      recipe_id CHAR(36) NOT NULL,
      ingredient VARCHAR(255) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      CONSTRAINT fk_recipe_ingredients_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
        ON DELETE CASCADE,
      INDEX idx_recipe_ingredients_recipe_id (recipe_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function seedRecipesIfEmpty() {
  const [[{ recipeCount }]] = await pool.query('SELECT COUNT(*) AS recipeCount FROM recipes');

  if (recipeCount > 0) {
    return;
  }

  for (const recipe of defaultRecipes) {
    await insertRecipe(recipe);
  }
}

async function initDatabase() {
  await createTables();
  await seedRecipesIfEmpty();
}

async function getRecipes() {
  const [rows] = await pool.query(`
    SELECT
      r.id,
      r.title,
      r.author,
      r.category,
      r.time,
      r.description,
      r.accent,
      ri.ingredient,
      ri.sort_order
    FROM recipes r
    LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    ORDER BY r.created_at DESC, ri.sort_order ASC, ri.id ASC
  `);

  const recipesById = new Map();

  for (const row of rows) {
    if (!recipesById.has(row.id)) {
      recipesById.set(row.id, {
        id: row.id,
        title: row.title,
        author: row.author,
        category: row.category,
        time: row.time,
        description: row.description,
        accent: row.accent,
        ingredients: []
      });
    }

    if (row.ingredient) {
      recipesById.get(row.id).ingredients.push(row.ingredient);
    }
  }

  return Array.from(recipesById.values());
}

async function insertRecipe(input) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const recipe = {
      id: input.id || randomUUID(),
      title: String(input.title).trim(),
      author: String(input.author).trim(),
      category: String(input.category).trim(),
      time: String(input.time).trim(),
      description: String(input.description).trim(),
      ingredients: Array.isArray(input.ingredients)
        ? input.ingredients.map((ingredient) => String(ingredient).trim()).filter(Boolean)
        : [],
      accent: input.accent || accentCycle[input.ingredients?.length ? input.ingredients.length % accentCycle.length : 0]
    };

    await connection.query(
      `
        INSERT INTO recipes (id, title, author, category, time, description, accent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [recipe.id, recipe.title, recipe.author, recipe.category, recipe.time, recipe.description, recipe.accent]
    );

    if (recipe.ingredients.length > 0) {
      const ingredientValues = recipe.ingredients.map((ingredient, index) => [recipe.id, ingredient, index]);
      await connection.query(
        `
          INSERT INTO recipe_ingredients (recipe_id, ingredient, sort_order)
          VALUES ?
        `,
        [ingredientValues]
      );
    }

    await connection.commit();
    return recipe;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getRecipeCount() {
  const [[{ recipeCount }]] = await pool.query('SELECT COUNT(*) AS recipeCount FROM recipes');
  return recipeCount;
}

async function pingDatabase() {
  await pool.query('SELECT 1');
}

module.exports = {
  getRecipeCount,
  getRecipes,
  initDatabase,
  insertRecipe,
  pingDatabase,
  pool
};