const express = require('express');
const path = require('path');
const { getRecipeCount, getRecipes, initDatabase, insertRecipe, pingDatabase } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', async (_request, response) => {
  try {
    await pingDatabase();
    response.json({ status: 'ok', database: 'ok' });
  } catch (error) {
    response.status(503).json({ status: 'degraded', database: 'unreachable' });
  }
});

app.get('/api/recipes', async (_request, response) => {
  try {
    const recipes = await getRecipes();
    response.json(recipes);
  } catch (error) {
    response.status(500).json({ error: 'Could not load recipes.' });
  }
});

app.post('/api/recipes', async (request, response) => {
  const { title, author, category, time, description, ingredients } = request.body;

  if (!title || !author || !category || !time || !description) {
    response.status(400).json({ error: 'Missing required fields.' });
    return;
  }

  const normalizedIngredients = Array.isArray(ingredients)
    ? ingredients.map((ingredient) => String(ingredient).trim()).filter(Boolean)
    : [];

  try {
    const recipeCount = await getRecipeCount();
    const recipe = await insertRecipe({
      title,
      author,
      category,
      time,
      description,
      ingredients: normalizedIngredients,
      accent: ['sunrise', 'berry', 'forest', 'ocean'][recipeCount % 4]
    });

    response.status(201).json(recipe);
  } catch (error) {
    response.status(500).json({ error: 'Could not save recipe.' });
  }
});

app.get('*', (_request, response) => {
  response.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
  try {
    await initDatabase();
    app.listen(port, () => {
      console.log(`Recipe Share is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize the database.', error.message);
    process.exit(1);
  }
}

startServer();