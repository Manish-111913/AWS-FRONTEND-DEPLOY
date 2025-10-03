import { http } from './apiClient';

// Toggle for recipe debug logging. Set window.__DEBUG_RECIPES = true in dev console to re-enable temporarily.
const DEBUG_RECIPES = (typeof window !== 'undefined' && window.__DEBUG_RECIPES) || false;

class RecipesService {
  // Get all recipes
  static async getRecipes() {
    try {
  if (DEBUG_RECIPES) console.log('🔍 Fetching all recipes...');
      
      const data = await http.get('/recipes');
      if (!data || data.success === false) {
        console.error('❌ Failed to fetch recipes:', data);
        throw new Error((data && data.error) || 'Failed to fetch recipes');
      }
      
  if (DEBUG_RECIPES) console.log(`📦 Loaded ${data.data?.length ?? 0} recipes`);
      return data.data;
    } catch (error) {
      console.error('❌ Error fetching recipes:', error);
      throw error;
    }
  }

  // Get ingredients for a specific recipe
  static async getRecipeIngredients(recipeId) {
    try {
  if (DEBUG_RECIPES) console.log(`🔍 Fetching ingredients for recipe ${recipeId}`);
      
      const data = await http.get(`/recipes/${recipeId}/ingredients`);
      if (!data || data.success === false) {
        console.error('❌ Failed to fetch ingredients:', data);
        throw new Error((data && data.error) || 'Failed to fetch recipe ingredients');
      }
      
  if (DEBUG_RECIPES) console.log(`📦 Loaded ${data.data?.length ?? 0} ingredients for recipe ${recipeId}`);
      return data.data;
    } catch (error) {
      // Handle AbortErrors gracefully
      if (error.name === 'AbortError' || error.aborted) {
        console.log(`Recipe ingredients request aborted for recipe ${recipeId}`);
        return []; // Return empty array for aborted requests
      }
      console.error('❌ Error fetching recipe ingredients:', error);
      throw error;
    }
  }

  // Create a new recipe
  static async createRecipe(recipeData) {
    try {
  const data = await http.post('/recipes', recipeData);
  if (!data || data.success === false) throw new Error((data && data.error) || 'Failed to create recipe');
  return data.data;
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  }

  // Update a recipe
  static async updateRecipe(recipeId, recipeData) {
    try {
      console.log(`🔄 Updating recipe ${recipeId}:`, recipeData);
      
      const data = await http.put(`/recipes/${recipeId}`, recipeData);
      if (!data || data.success === false) {
        console.error('❌ Failed to update recipe:', data);
        throw new Error((data && data.error) || 'Failed to update recipe');
      }
      
      console.log('✅ Recipe updated successfully:', data.data);
      return data.data;
    } catch (error) {
      console.error('❌ Error updating recipe:', error);
      throw error;
    }
  }

  // Update recipe ingredients
  static async updateRecipeIngredients(recipeId, ingredients) {
    try {
      console.log(`🔄 Updating ingredients for recipe ${recipeId}:`, ingredients);
      
      const data = await http.put(`/recipes/${recipeId}/ingredients`, { ingredients });
      console.log('📨 Server response:', data);
      if (!data || data.success === false) {
        console.error('❌ Server error:', data);
        throw new Error((data && data.error) || 'Failed to update recipe ingredients');
      }
      console.log(`✅ Successfully updated ${data.ingredientCount || 0} ingredients`);
      return data;
    } catch (error) {
      console.error('❌ Error updating recipe ingredients:', error);
      throw error;
    }
  }

  // Set recipe confirmation status
  static async setRecipeStatus(recipeId, status) {
    const data = await http.put(`/recipes/${recipeId}/status`, { status });
    if (!data.success) throw new Error(data.error || 'Failed to set recipe status');
    return data.data;
  }
}

export default RecipesService;