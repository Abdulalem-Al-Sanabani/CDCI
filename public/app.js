const recipeList = document.getElementById('recipe-list');
const recipeCount = document.getElementById('recipe-count');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const recipeForm = document.getElementById('recipe-form');
const formMessage = document.getElementById('form-message');
const recipeCardTemplate = document.getElementById('recipe-card-template');

const state = {
  recipes: []
};

function renderRecipes() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const filteredRecipes = state.recipes.filter((recipe) => {
    const matchesCategory = category === 'All' || recipe.category === category;
    const searchableText = [recipe.title, recipe.author, recipe.description, recipe.ingredients.join(' ')]
      .join(' ')
      .toLowerCase();

    return matchesCategory && searchableText.includes(query);
  });

  recipeList.innerHTML = '';
  emptyState.hidden = filteredRecipes.length !== 0;
  recipeCount.textContent = String(state.recipes.length).padStart(2, '0');

  filteredRecipes.forEach((recipe, index) => {
    const fragment = recipeCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector('.recipe-card');

    card.classList.add(`accent-${recipe.accent || 'sunrise'}`);
    card.style.animationDelay = `${index * 80}ms`;

    fragment.querySelector('.recipe-category').textContent = recipe.category;
    fragment.querySelector('.recipe-time').textContent = recipe.time;
    fragment.querySelector('.recipe-title').textContent = recipe.title;
    fragment.querySelector('.recipe-description').textContent = recipe.description;
    fragment.querySelector('.recipe-author').textContent = `Shared by ${recipe.author}`;

    const ingredientList = fragment.querySelector('.ingredient-list');
    recipe.ingredients.slice(0, 5).forEach((ingredient) => {
      const item = document.createElement('li');
      item.textContent = ingredient;
      ingredientList.appendChild(item);
    });

    recipeList.appendChild(fragment);
  });
}

async function loadRecipes() {
  const response = await fetch('/api/recipes');
  state.recipes = await response.json();
  renderRecipes();
}

function setFormMessage(message, tone) {
  formMessage.textContent = message;
  formMessage.dataset.tone = tone;
}

async function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(recipeForm);
  const payload = {
    title: formData.get('title'),
    author: formData.get('author'),
    category: formData.get('category'),
    time: formData.get('time'),
    description: formData.get('description'),
    ingredients: String(formData.get('ingredients') || '')
      .split(',')
      .map((ingredient) => ingredient.trim())
      .filter(Boolean)
  };

  try {
    setFormMessage('Sharing recipe...', 'success');

    const response = await fetch('/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Unable to share recipe right now.');
    }

    const recipe = await response.json();
    state.recipes.unshift(recipe);
    recipeForm.reset();
    categoryFilter.value = 'All';
    searchInput.value = '';
    setFormMessage('Recipe shared successfully.', 'success');
    renderRecipes();
  } catch (error) {
    setFormMessage(error.message, 'error');
  }
}

searchInput.addEventListener('input', renderRecipes);
categoryFilter.addEventListener('change', renderRecipes);
recipeForm.addEventListener('submit', handleSubmit);

loadRecipes().catch(() => {
  setFormMessage('Could not load recipes from the server.', 'error');
});