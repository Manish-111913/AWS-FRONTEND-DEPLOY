// Indian Menu Items with Ingredient Mappings
// 50 Common Indian Menu Items: 15 Breakfast + 20 Lunch + 5 Desserts + 5 Drinks + 5 Snacks

export const menuItems = [
  // BREAKFAST ITEMS (15)
  {
    id: 1,
    name: 'Masala Dosa',
    category: 'Breakfast',
    price: 80,
    servings: 1,
    prepTime: 20,
    ingredients: [
      { name: 'Rice', quantity: 0.15, unit: 'kg' },
      { name: 'Urad Dal', quantity: 0.05, unit: 'kg' },
      { name: 'Potato', quantity: 0.1, unit: 'kg' },
      { name: 'Onion', quantity: 0.03, unit: 'kg' },
      { name: 'Mustard Seeds', quantity: 0.002, unit: 'kg' },
      { name: 'Turmeric Powder', quantity: 0.001, unit: 'kg' },
      { name: 'Sunflower Oil', quantity: 0.02, unit: 'L' }
    ]
  },
  {
    id: 2,
    name: 'Idli Sambar',
    category: 'Breakfast',
    price: 60,
    servings: 1,
    prepTime: 15,
    ingredients: [
      { name: 'Rice', quantity: 0.1, unit: 'kg' },
      { name: 'Urad Dal', quantity: 0.03, unit: 'kg' },
      { name: 'Toor Dal', quantity: 0.02, unit: 'kg' },
      { name: 'Tomato', quantity: 0.05, unit: 'kg' },
      { name: 'Tamarind', quantity: 0.005, unit: 'kg' },
      { name: 'Sambhar Powder', quantity: 0.005, unit: 'kg' }
    ]
  },
  {
    id: 3,
    name: 'Poha',
    category: 'Breakfast',
    price: 40,
    servings: 1,
    prepTime: 10,
    ingredients: [
      { name: 'Poha', quantity: 0.08, unit: 'kg' },
      { name: 'Onion', quantity: 0.03, unit: 'kg' },
      { name: 'Green Chili', quantity: 0.005, unit: 'kg' },
      { name: 'Mustard Seeds', quantity: 0.002, unit: 'kg' },
      { name: 'Turmeric Powder', quantity: 0.001, unit: 'kg' },
      { name: 'Coriander Leaves', quantity: 0.01, unit: 'kg' }
    ]
  },
  {
    id: 4,
    name: 'Upma',
    category: 'Breakfast',
    price: 35,
    servings: 1,
    prepTime: 12,
    ingredients: [
      { name: 'Semolina', quantity: 0.08, unit: 'kg' },
      { name: 'Onion', quantity: 0.03, unit: 'kg' },
      { name: 'Green Chili', quantity: 0.005, unit: 'kg' },
      { name: 'Ginger', quantity: 0.005, unit: 'kg' },
      { name: 'Mustard Seeds', quantity: 0.002, unit: 'kg' },
      { name: 'Curry Leaves', quantity: 0.002, unit: 'kg' }
    ]
  },
  {
    id: 5,
    name: 'Aloo Paratha',
    category: 'Breakfast',
    price: 70,
    servings: 1,
    prepTime: 25,
    ingredients: [
      { name: 'Wheat Flour', quantity: 0.1, unit: 'kg' },
      { name: 'Potato', quantity: 0.12, unit: 'kg' },
      { name: 'Green Chili', quantity: 0.005, unit: 'kg' },
      { name: 'Ginger', quantity: 0.005, unit: 'kg' },
      { name: 'Coriander Leaves', quantity: 0.01, unit: 'kg' },
      { name: 'Ghee', quantity: 0.015, unit: 'kg' }
    ]
  },
  {
    id: 6,
    name: 'Puri Bhaji',
    category: 'Breakfast',
    price: 65,
    servings: 1,
    prepTime: 20,
    ingredients: [
      { name: 'Wheat Flour', quantity: 0.08, unit: 'kg' },
      { name: 'Potato', quantity: 0.1, unit: 'kg' },
      { name: 'Onion', quantity: 0.03, unit: 'kg' },
      { name: 'Tomato', quantity: 0.04, unit: 'kg' },
      { name: 'Cumin Seeds', quantity: 0.002, unit: 'kg' },
      { name: 'Sunflower Oil', quantity: 0.05, unit: 'L' }
    ]
  },
  {
    id: 7,
    name: 'Medu Vada',
    category: 'Breakfast',
    price: 50,
    servings: 1,
    prepTime: 15,
    ingredients: [
      { name: 'Urad Dal', quantity: 0.08, unit: 'kg' },
      { name: 'Green Chili', quantity: 0.005, unit: 'kg' },
      { name: 'Ginger', quantity: 0.005, unit: 'kg' },
      { name: 'Curry Leaves', quantity: 0.002, unit: 'kg' },
      { name: 'Asafoetida', quantity: 0.0005, unit: 'kg' },
      { name: 'Sunflower Oil', quantity: 0.1, unit: 'L' }
    ]
  },
  {
    id: 8,
    name: 'Rava Dosa',
    category: 'Breakfast',
    price: 90,
    servings: 1,
    prepTime: 18,
    ingredients: [
      { name: 'Semolina', quantity: 0.06, unit: 'kg' },
      { name: 'Rice Flour', quantity: 0.03, unit: 'kg' },
      { name: 'All Purpose Flour', quantity: 0.02, unit: 'kg' },
      { name: 'Onion', quantity: 0.03, unit: 'kg' },
      { name: 'Green Chili', quantity: 0.005, unit: 'kg' },
      { name: 'Coriander Leaves', quantity: 0.01, unit: 'kg' }
    ]
  },
  {
    id: 9,
    name: 'Pesarattu',
    category: 'Breakfast',
    price: 75,
    servings: 1,
    prepTime: 20,
    ingredients: [
      { name: 'Green Moong', quantity: 0.1, unit: 'kg' },
      { name: 'Rice', quantity: 0.02, unit: 'kg' },
      { name: 'Green Chili', quantity: 0.005, unit: 'kg' },
      { name: 'Ginger', quantity: 0.005, unit: 'kg' },
      { name: 'Cumin Seeds', quantity: 0.002, unit: 'kg' },
      { name: 'Sunflower Oil', quantity: 0.015, unit: 'L' }
    ]
  },
  {
    id: 10,
    name: 'Uttapam',
    category: 'Breakfast',
    price: 85,
    servings: 1,
    prepTime: 15,
    ingredients: [
      { name: 'Rice', quantity: 0.12, unit: 'kg' },
      { name: 'Urad Dal', quantity: 0.04, unit: 'kg' },
      { name: 'Onion', quantity: 0.04, unit: 'kg' },
      { name: 'Tomato', quantity: 0.03, unit: 'kg' },
      { name: 'Green Chili', quantity: 0.005, unit: 'kg' },
      { name: 'Coriander Leaves', quantity: 0.01, unit: 'kg' }
    ]
  },
  {
    id: 11,
    name: 'Dhokla',
    category: 'Breakfast',
    price: 55,
    servings: 1,
    prepTime: 25,
    ingredients: [
      { name: 'Besan', quantity: 0.08, unit: 'kg' },
      { name: 'Semolina', quantity: 0.02, unit: 'kg' },
      { name: 'Green Chili', quantity: 0.005, unit: 'kg' },
      { name: 'Ginger', quantity: 0.005, unit: 'kg' },
      { name: 'Mustard Seeds', quantity: 0.002, unit: 'kg' },
      { name: 'Curry Leaves', quantity: 0.002, unit: 'kg' }
    ]
  },
  {
    id: 12,
    name: 'Appam',
    category: 'Breakfast',
    price: 70,
    servings: 1,
    prepTime: 20,
    ingredients: [
      { name: 'Rice', quantity: 0.1, unit: 'kg' },
      { name: 'Coconut', quantity: 0.05, unit: 'kg' },
      { name: 'Coconut Milk', quantity: 0.1, unit: 'L' },
      { name: 'Yeast', quantity: 0.002, unit: 'kg' },
      { name: 'Sugar', quantity: 0.01, unit: 'kg' },
      { name: 'Coconut Oil', quantity: 0.01, unit: 'L' }
    ]
  },
  {
    id: 13,
    name: 'Puttu',
    category: 'Breakfast',
    price: 65,
    servings: 1,
    prepTime: 15,
    ingredients: [
      { name: 'Rice Flour', quantity: 0.1, unit: 'kg' },
      { name: 'Coconut', quantity: 0.06, unit: 'kg' },
      { name: 'Salt', quantity: 0.002, unit: 'kg' },
      { name: 'Water', quantity: 0.08, unit: 'L' }
    ]
  },
  {
    id: 14,
    name: 'Kachori',
    category: 'Breakfast',
    price: 45,
    servings: 1,
    prepTime: 30,
    ingredients: [
      { name: 'All Purpose Flour', quantity: 0.08, unit: 'kg' },
      { name: 'Moong Dal', quantity: 0.04, unit: 'kg' },
      { name: 'Fennel Seeds', quantity: 0.002, unit: 'kg' },
      { name: 'Asafoetida', quantity: 0.0005, unit: 'kg' },
      { name: 'Red Chili Powder', quantity: 0.002, unit: 'kg' },
      { name: 'Sunflower Oil', quantity: 0.08, unit: 'L' }
    ]
  },
  {
    id: 15,
    name: 'Chole Bhature',
    category: 'Breakfast',
    price: 120,
    servings: 1,
    prepTime: 35,
    ingredients: [
      { name: 'Kabuli Chana', quantity: 0.1, unit: 'kg' },
      { name: 'All Purpose Flour', quantity: 0.1, unit: 'kg' },
      { name: 'Onion', quantity: 0.05, unit: 'kg' },
      { name: 'Tomato', quantity: 0.06, unit: 'kg' },
      { name: 'Ginger Garlic Paste', quantity: 0.01, unit: 'kg' },
      { name: 'Chole Masala', quantity: 0.005, unit: 'kg' }
    ]
  },

  // LUNCH ITEMS (20)
  {
    id: 16,
    name: 'Chicken Biryani',
    category: 'Lunch',
    price: 250,
    servings: 1,
    prepTime: 60,
    ingredients: [
      { name: 'Basmati Rice', quantity: 0.15, unit: 'kg' },
      { name: 'Chicken', quantity: 0.2, unit: 'kg' },
      { name: 'Onion', quantity: 0.08, unit: 'kg' },
      { name: 'Yogurt', quantity: 0.05, unit: 'kg' },
      { name: 'Biryani Masala', quantity: 0.01, unit: 'kg' },
      { name: 'Ghee', quantity: 0.03, unit: 'kg' },
      { name: 'Mint Leaves', quantity: 0.01, unit: 'kg' }
    ]
  },
  {
    id: 17,
    name: 'Mutton Curry',
    category: 'Lunch',
    price: 280,
    servings: 1,
    prepTime: 90,
    ingredients: [
      { name: 'Mutton', quantity: 0.25, unit: 'kg' },
      { name: 'Onion', quantity: 0.1, unit: 'kg' },
      { name: 'Tomato', quantity: 0.08, unit: 'kg' },
      { name: 'Ginger Garlic Paste', quantity: 0.015, unit: 'kg' },
      { name: 'Red Chili Powder', quantity: 0.005, unit: 'kg' },
      { name: 'Garam Masala', quantity: 0.003, unit: 'kg' },
      { name: 'Mustard Oil', quantity: 0.03, unit: 'L' }
    ]
  },
  {
    id: 18,
    name: 'Paneer Butter Masala',
    category: 'Lunch',
    price: 180,
    servings: 1,
    prepTime: 25,
    ingredients: [
      { name: 'Paneer', quantity: 0.15, unit: 'kg' },
      { name: 'Tomato', quantity: 0.1, unit: 'kg' },
      { name: 'Onion', quantity: 0.05, unit: 'kg' },
      { name: 'Cream', quantity: 0.03, unit: 'L' },
      { name: 'Butter', quantity: 0.02, unit: 'kg' },
      { name: 'Garam Masala', quantity: 0.003, unit: 'kg' },
      { name: 'Kasuri Methi', quantity: 0.002, unit: 'kg' }
    ]
  },
  {
    id: 19,
    name: 'Dal Tadka',
    category: 'Lunch',
    price: 80,
    servings: 1,
    prepTime: 30,
    ingredients: [
      { name: 'Toor Dal', quantity: 0.08, unit: 'kg' },
      { name: 'Onion', quantity: 0.03, unit: 'kg' },
      { name: 'Tomato', quantity: 0.04, unit: 'kg' },
      { name: 'Green Chili', quantity: 0.005, unit: 'kg' },
      { name: 'Cumin Seeds', quantity: 0.002, unit: 'kg' },
      { name: 'Turmeric Powder', quantity: 0.002, unit: 'kg' },
      { name: 'Ghee', quantity: 0.015, unit: 'kg' }
    ]
  },
  {
    id: 20,
    name: 'Fish Curry',
    category: 'Lunch',
    price: 200,
    servings: 1,
    prepTime: 35,
    ingredients: [
      { name: 'Fish', quantity: 0.2, unit: 'kg' },
      { name: 'Coconut', quantity: 0.08, unit: 'kg' },
      { name: 'Onion', quantity: 0.06, unit: 'kg' },
      { name: 'Tomato', quantity: 0.05, unit: 'kg' },
      { name: 'Tamarind', quantity: 0.01, unit: 'kg' },
      { name: 'Fish Masala', quantity: 0.008, unit: 'kg' },
      { name: 'Coconut Oil', quantity: 0.025, unit: 'L' }
    ]
  },
  {
    id: 21,
    name: 'Rajma',
    category: 'Lunch',
    price: 120,
    servings: 1,
    prepTime: 45,
    ingredients: [
      { name: 'Rajma', quantity: 0.1, unit: 'kg' },
      { name: 'Onion', quantity: 0.06, unit: 'kg' },
      { name: 'Tomato', quantity: 0.08, unit: 'kg' },
      { name: 'Ginger Garlic Paste', quantity: 0.01, unit: 'kg' },
      { name: 'Red Chili Powder', quantity: 0.003, unit: 'kg' },
      { name: 'Garam Masala', quantity: 0.003, unit: 'kg' }
    ]
  },
  {
    id: 22,
    name: 'Aloo Gobi',
    category: 'Lunch',
    price: 100,
    servings: 1,
    prepTime: 25,
    ingredients: [
      { name: 'Potato', quantity: 0.12, unit: 'kg' },
      { name: 'Cauliflower', quantity: 0.15, unit: 'kg' },
      { name: 'Onion', quantity: 0.04, unit: 'kg' },
      { name: 'Ginger', quantity: 0.008, unit: 'kg' },
      { name: 'Turmeric Powder', quantity: 0.002, unit: 'kg' },
      { name: 'Cumin Seeds', quantity: 0.002, unit: 'kg' }
    ]
  },
  {
    id: 23,
    name: 'Palak Paneer',
    category: 'Lunch',
    price: 160,
    servings: 1,
    prepTime: 30,
    ingredients: [
      { name: 'Spinach', quantity: 0.2, unit: 'kg' },
      { name: 'Paneer', quantity: 0.12, unit: 'kg' },
      { name: 'Onion', quantity: 0.04, unit: 'kg' },
      { name: 'Tomato', quantity: 0.05, unit: 'kg' },
      { name: 'Ginger Garlic Paste', quantity: 0.008, unit: 'kg' },
      { name: 'Cream', quantity: 0.02, unit: 'L' }
    ]
  },
  {
    id: 24,
    name: 'Bhindi Masala',
    category: 'Lunch',
    price: 90,
    servings: 1,
    prepTime: 20,
    ingredients: [
      { name: 'Okra', quantity: 0.2, unit: 'kg' },
      { name: 'Onion', quantity: 0.05, unit: 'kg' },
      { name: 'Tomato', quantity: 0.04, unit: 'kg' },
      { name: 'Green Chili', quantity: 0.005, unit: 'kg' },
      { name: 'Coriander Powder', quantity: 0.003, unit: 'kg' },
      { name: 'Amchur Powder', quantity: 0.002, unit: 'kg' }
    ]
  },
  {
    id: 25,
    name: 'Kadai Chicken',
    category: 'Lunch',
    price: 220,
    servings: 1,
    prepTime: 40,
    ingredients: [
      { name: 'Chicken', quantity: 0.2, unit: 'kg' },
      { name: 'Bell Pepper', quantity: 0.08, unit: 'kg' },
      { name: 'Onion', quantity: 0.06, unit: 'kg' },
      { name: 'Tomato', quantity: 0.08, unit: 'kg' },
      { name: 'Ginger Garlic Paste', quantity: 0.012, unit: 'kg' },
      { name: 'Kadai Masala', quantity: 0.008, unit: 'kg' }
    ]
  },
  {
    id: 26,
    name: 'Baingan Bharta',
    category: 'Lunch',
    price: 110,
    servings: 1,
    prepTime: 35,
    ingredients: [
      { name: 'Eggplant', quantity: 0.25, unit: 'kg' },
      { name: 'Onion', quantity: 0.06, unit: 'kg' },
      { name: 'Tomato', quantity: 0.08, unit: 'kg' },
      { name: 'Green Chili', quantity: 0.008, unit: 'kg' },
      { name: 'Ginger Garlic Paste', quantity: 0.01, unit: 'kg' },
      { name: 'Mustard Oil', quantity: 0.02, unit: 'L' }
    ]
  },
  {
    id: 27,
    name: 'Chole',
    category: 'Lunch',
    price: 100,
    servings: 1,
    prepTime: 40,
    ingredients: [
      { name: 'Kabuli Chana', quantity: 0.12, unit: 'kg' },
      { name: 'Onion', quantity: 0.06, unit: 'kg' },
      { name: 'Tomato', quantity: 0.08, unit: 'kg' },
      { name: 'Ginger Garlic Paste', quantity: 0.01, unit: 'kg' },
      { name: 'Chole Masala', quantity: 0.008, unit: 'kg' },
      { name: 'Tea Bags', quantity: 0.002, unit: 'kg' }
    ]
  },
  {
    id: 28,
    name: 'Malai Kofta',
    category: 'Lunch',
    price: 190,
    servings: 1,
    prepTime: 45,
    ingredients: [
      { name: 'Paneer', quantity: 0.1, unit: 'kg' },
      { name: 'Potato', quantity: 0.08, unit: 'kg' },
      { name: 'Cashews', quantity: 0.03, unit: 'kg' },
      { name: 'Cream', quantity: 0.04, unit: 'L' },
      { name: 'Tomato', quantity: 0.1, unit: 'kg' },
      { name: 'Onion', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 29,
    name: 'Prawn Curry',
    category: 'Lunch',
    price: 240,
    servings: 1,
    prepTime: 30,
    ingredients: [
      { name: 'Prawns', quantity: 0.2, unit: 'kg' },
      { name: 'Coconut Milk', quantity: 0.15, unit: 'L' },
      { name: 'Onion', quantity: 0.05, unit: 'kg' },
      { name: 'Tomato', quantity: 0.06, unit: 'kg' },
      { name: 'Curry Leaves', quantity: 0.005, unit: 'kg' },
      { name: 'Coconut Oil', quantity: 0.02, unit: 'L' }
    ]
  },
  {
    id: 30,
    name: 'Dum Aloo',
    category: 'Lunch',
    price: 130,
    servings: 1,
    prepTime: 35,
    ingredients: [
      { name: 'Baby Potato', quantity: 0.2, unit: 'kg' },
      { name: 'Yogurt', quantity: 0.06, unit: 'kg' },
      { name: 'Onion', quantity: 0.05, unit: 'kg' },
      { name: 'Tomato', quantity: 0.06, unit: 'kg' },
      { name: 'Garam Masala', quantity: 0.005, unit: 'kg' },
      { name: 'Ghee', quantity: 0.02, unit: 'kg' }
    ]
  },
  {
    id: 31,
    name: 'Keema',
    category: 'Lunch',
    price: 200,
    servings: 1,
    prepTime: 40,
    ingredients: [
      { name: 'Mutton Mince', quantity: 0.2, unit: 'kg' },
      { name: 'Onion', quantity: 0.08, unit: 'kg' },
      { name: 'Tomato', quantity: 0.06, unit: 'kg' },
      { name: 'Green Peas', quantity: 0.05, unit: 'kg' },
      { name: 'Ginger Garlic Paste', quantity: 0.012, unit: 'kg' },
      { name: 'Garam Masala', quantity: 0.005, unit: 'kg' }
    ]
  },
  {
    id: 32,
    name: 'Sambhar',
    category: 'Lunch',
    price: 70,
    servings: 1,
    prepTime: 35,
    ingredients: [
      { name: 'Toor Dal', quantity: 0.08, unit: 'kg' },
      { name: 'Drumstick', quantity: 0.1, unit: 'kg' },
      { name: 'Okra', quantity: 0.05, unit: 'kg' },
      { name: 'Tomato', quantity: 0.06, unit: 'kg' },
      { name: 'Tamarind', quantity: 0.01, unit: 'kg' },
      { name: 'Sambhar Powder', quantity: 0.008, unit: 'kg' }
    ]
  },
  {
    id: 33,
    name: 'Rasam',
    category: 'Lunch',
    price: 60,
    servings: 1,
    prepTime: 25,
    ingredients: [
      { name: 'Toor Dal', quantity: 0.04, unit: 'kg' },
      { name: 'Tomato', quantity: 0.08, unit: 'kg' },
      { name: 'Tamarind', quantity: 0.015, unit: 'kg' },
      { name: 'Rasam Powder', quantity: 0.008, unit: 'kg' },
      { name: 'Curry Leaves', quantity: 0.003, unit: 'kg' },
      { name: 'Ghee', quantity: 0.01, unit: 'kg' }
    ]
  },
  {
    id: 34,
    name: 'Vegetable Biryani',
    category: 'Lunch',
    price: 180,
    servings: 1,
    prepTime: 50,
    ingredients: [
      { name: 'Basmati Rice', quantity: 0.15, unit: 'kg' },
      { name: 'Mixed Vegetables', quantity: 0.2, unit: 'kg' },
      { name: 'Onion', quantity: 0.06, unit: 'kg' },
      { name: 'Yogurt', quantity: 0.04, unit: 'kg' },
      { name: 'Biryani Masala', quantity: 0.008, unit: 'kg' },
      { name: 'Ghee', quantity: 0.025, unit: 'kg' }
    ]
  },
  {
    id: 35,
    name: 'Butter Chicken',
    category: 'Lunch',
    price: 260,
    servings: 1,
    prepTime: 45,
    ingredients: [
      { name: 'Chicken', quantity: 0.2, unit: 'kg' },
      { name: 'Tomato', quantity: 0.12, unit: 'kg' },
      { name: 'Cream', quantity: 0.05, unit: 'L' },
      { name: 'Butter', quantity: 0.03, unit: 'kg' },
      { name: 'Cashews', quantity: 0.02, unit: 'kg' },
      { name: 'Garam Masala', quantity: 0.005, unit: 'kg' }
    ]
  },

  // DESSERTS (5)
  {
    id: 36,
    name: 'Gulab Jamun',
    category: 'Desserts',
    price: 80,
    servings: 1,
    prepTime: 30,
    ingredients: [
      { name: 'Khoya', quantity: 0.08, unit: 'kg' },
      { name: 'All Purpose Flour', quantity: 0.02, unit: 'kg' },
      { name: 'Sugar', quantity: 0.1, unit: 'kg' },
      { name: 'Cardamom Powder', quantity: 0.002, unit: 'kg' },
      { name: 'Rose Water', quantity: 0.005, unit: 'L' },
      { name: 'Ghee', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 37,
    name: 'Rasgulla',
    category: 'Desserts',
    price: 70,
    servings: 1,
    prepTime: 45,
    ingredients: [
      { name: 'Paneer', quantity: 0.1, unit: 'kg' },
      { name: 'Sugar', quantity: 0.12, unit: 'kg' },
      { name: 'Cardamom Powder', quantity: 0.002, unit: 'kg' },
      { name: 'Lemon Juice', quantity: 0.01, unit: 'L' },
      { name: 'Water', quantity: 0.5, unit: 'L' }
    ]
  },
  {
    id: 38,
    name: 'Kheer',
    category: 'Desserts',
    price: 90,
    servings: 1,
    prepTime: 40,
    ingredients: [
      { name: 'Rice', quantity: 0.03, unit: 'kg' },
      { name: 'Milk', quantity: 0.5, unit: 'L' },
      { name: 'Sugar', quantity: 0.06, unit: 'kg' },
      { name: 'Cardamom Powder', quantity: 0.002, unit: 'kg' },
      { name: 'Almonds', quantity: 0.01, unit: 'kg' },
      { name: 'Raisins', quantity: 0.01, unit: 'kg' }
    ]
  },
  {
    id: 39,
    name: 'Kulfi',
    category: 'Desserts',
    price: 60,
    servings: 1,
    prepTime: 20,
    ingredients: [
      { name: 'Milk', quantity: 0.3, unit: 'L' },
      { name: 'Sugar', quantity: 0.04, unit: 'kg' },
      { name: 'Cardamom Powder', quantity: 0.002, unit: 'kg' },
      { name: 'Pistachios', quantity: 0.01, unit: 'kg' },
      { name: 'Almonds', quantity: 0.01, unit: 'kg' }
    ]
  },
  {
    id: 40,
    name: 'Jalebi',
    category: 'Desserts',
    price: 100,
    servings: 1,
    prepTime: 35,
    ingredients: [
      { name: 'All Purpose Flour', quantity: 0.08, unit: 'kg' },
      { name: 'Yogurt', quantity: 0.02, unit: 'kg' },
      { name: 'Sugar', quantity: 0.12, unit: 'kg' },
      { name: 'Saffron', quantity: 0.0005, unit: 'kg' },
      { name: 'Lemon Juice', quantity: 0.005, unit: 'L' },
      { name: 'Ghee', quantity: 0.1, unit: 'kg' }
    ]
  },

  // DRINKS (5)
  {
    id: 41,
    name: 'Masala Chai',
    category: 'Drinks',
    price: 25,
    servings: 1,
    prepTime: 8,
    ingredients: [
      { name: 'Tea Leaves', quantity: 0.005, unit: 'kg' },
      { name: 'Milk', quantity: 0.15, unit: 'L' },
      { name: 'Sugar', quantity: 0.015, unit: 'kg' },
      { name: 'Cardamom', quantity: 0.001, unit: 'kg' },
      { name: 'Ginger', quantity: 0.003, unit: 'kg' }
    ]
  },
  {
    id: 42,
    name: 'Lassi',
    category: 'Drinks',
    price: 50,
    servings: 1,
    prepTime: 5,
    ingredients: [
      { name: 'Yogurt', quantity: 0.15, unit: 'kg' },
      { name: 'Sugar', quantity: 0.02, unit: 'kg' },
      { name: 'Cardamom Powder', quantity: 0.001, unit: 'kg' },
      { name: 'Rose Water', quantity: 0.002, unit: 'L' },
      { name: 'Ice Cubes', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 43,
    name: 'Mango Lassi',
    category: 'Drinks',
    price: 70,
    servings: 1,
    prepTime: 5,
    ingredients: [
      { name: 'Mango Pulp', quantity: 0.1, unit: 'kg' },
      { name: 'Yogurt', quantity: 0.12, unit: 'kg' },
      { name: 'Sugar', quantity: 0.02, unit: 'kg' },
      { name: 'Cardamom Powder', quantity: 0.001, unit: 'kg' },
      { name: 'Ice Cubes', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 44,
    name: 'Nimbu Paani',
    category: 'Drinks',
    price: 30,
    servings: 1,
    prepTime: 3,
    ingredients: [
      { name: 'Lemon Juice', quantity: 0.03, unit: 'L' },
      { name: 'Sugar', quantity: 0.02, unit: 'kg' },
      { name: 'Black Salt', quantity: 0.001, unit: 'kg' },
      { name: 'Mint Leaves', quantity: 0.005, unit: 'kg' },
      { name: 'Water', quantity: 0.2, unit: 'L' }
    ]
  },
  {
    id: 45,
    name: 'Filter Coffee',
    category: 'Drinks',
    price: 35,
    servings: 1,
    prepTime: 10,
    ingredients: [
      { name: 'Coffee Powder', quantity: 0.01, unit: 'kg' },
      { name: 'Milk', quantity: 0.15, unit: 'L' },
      { name: 'Sugar', quantity: 0.015, unit: 'kg' },
      { name: 'Water', quantity: 0.1, unit: 'L' }
    ]
  },

  // SNACKS (5)
  {
    id: 46,
    name: 'Samosa',
    category: 'Snacks',
    price: 20,
    servings: 1,
    prepTime: 25,
    ingredients: [
      { name: 'All Purpose Flour', quantity: 0.05, unit: 'kg' },
      { name: 'Potato', quantity: 0.08, unit: 'kg' },
      { name: 'Green Peas', quantity: 0.02, unit: 'kg' },
      { name: 'Cumin Seeds', quantity: 0.002, unit: 'kg' },
      { name: 'Coriander Seeds', quantity: 0.002, unit: 'kg' },
      { name: 'Sunflower Oil', quantity: 0.08, unit: 'L' }
    ]
  },
  {
    id: 47,
    name: 'Pakora',
    category: 'Snacks',
    price: 60,
    servings: 1,
    prepTime: 15,
    ingredients: [
      { name: 'Besan', quantity: 0.08, unit: 'kg' },
      { name: 'Onion', quantity: 0.06, unit: 'kg' },
      { name: 'Green Chili', quantity: 0.005, unit: 'kg' },
      { name: 'Carom Seeds', quantity: 0.001, unit: 'kg' },
      { name: 'Red Chili Powder', quantity: 0.002, unit: 'kg' },
      { name: 'Sunflower Oil', quantity: 0.1, unit: 'L' }
    ]
  },
  {
    id: 48,
    name: 'Pani Puri',
    category: 'Snacks',
    price: 40,
    servings: 1,
    prepTime: 20,
    ingredients: [
      { name: 'Puri Shells', quantity: 0.03, unit: 'kg' },
      { name: 'Potato', quantity: 0.05, unit: 'kg' },
      { name: 'Chickpeas', quantity: 0.03, unit: 'kg' },
      { name: 'Tamarind', quantity: 0.01, unit: 'kg' },
      { name: 'Mint Leaves', quantity: 0.01, unit: 'kg' },
      { name: 'Chat Masala', quantity: 0.003, unit: 'kg' }
    ]
  },
  {
    id: 49,
    name: 'Bhel Puri',
    category: 'Snacks',
    price: 50,
    servings: 1,
    prepTime: 10,
    ingredients: [
      { name: 'Puffed Rice', quantity: 0.05, unit: 'kg' },
      { name: 'Sev', quantity: 0.02, unit: 'kg' },
      { name: 'Onion', quantity: 0.03, unit: 'kg' },
      { name: 'Tomato', quantity: 0.03, unit: 'kg' },
      { name: 'Tamarind Chutney', quantity: 0.02, unit: 'kg' },
      { name: 'Green Chutney', quantity: 0.015, unit: 'kg' }
    ]
  },
  {
    id: 50,
    name: 'Vada Pav',
    category: 'Snacks',
    price: 25,
    servings: 1,
    prepTime: 20,
    ingredients: [
      { name: 'Potato', quantity: 0.1, unit: 'kg' },
      { name: 'Besan', quantity: 0.04, unit: 'kg' },
      { name: 'Bread Buns', quantity: 0.08, unit: 'kg' },
      { name: 'Green Chili', quantity: 0.005, unit: 'kg' },
      { name: 'Mustard Seeds', quantity: 0.002, unit: 'kg' },
      { name: 'Sunflower Oil', quantity: 0.08, unit: 'L' }
    ]
  }
];

// Helper functions
export const getMenuItemsByCategory = (category) => {
  return menuItems.filter(item => item.category === category);
};

export const getMenuItemById = (id) => {
  return menuItems.find(item => item.id === id);
};

export const getMenuItemByName = (name) => {
  return menuItems.find(item => 
    item.name.toLowerCase() === name.toLowerCase()
  );
};

export const searchMenuItems = (searchTerm) => {
  return menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const getCategories = () => {
  return [...new Set(menuItems.map(item => item.category))];
};

export const getMenuStats = () => {
  const stats = {};
  menuItems.forEach(item => {
    stats[item.category] = (stats[item.category] || 0) + 1;
  });
  return {
    total: menuItems.length,
    byCategory: stats
  };
};

export default menuItems;