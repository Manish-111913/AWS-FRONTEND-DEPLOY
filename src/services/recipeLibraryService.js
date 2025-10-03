import { http } from './apiClient';

class RecipeLibraryService {
  static async search(q) {
    const data = await http.get(`/recipe-library/search?q=${encodeURIComponent(q||'')}`);
    if (!data.success) throw new Error(data.error || 'Failed to search library');
    return data.data;
  }
  static async importByName(name) {
    const data = await http.post('/recipe-library/import', { name });
    if (!data.success) throw new Error(data.error || 'Failed to import recipe');
    return data.data;
  }
}

export default RecipeLibraryService;
