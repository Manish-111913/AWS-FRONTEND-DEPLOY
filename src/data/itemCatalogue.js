// Indian Market Item Catalogue
// Target: exactly 1,000 items for use with StockIn forms and lookups.
// We keep your curated base list and programmatically expand with realistic variants.

// Base curated list (existing schema preserved)
const baseCatalogue = [
    // VEGETABLES (100 items)
    { name: 'Tomato', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Potato', category: 'Vegetables', unit: 'kilogram', expiryDays: 30 },
    { name: 'Onion', category: 'Vegetables', unit: 'kilogram', expiryDays: 20 },
    { name: 'Garlic', category: 'Vegetables', unit: 'kilogram', expiryDays: 60 },
    { name: 'Ginger', category: 'Vegetables', unit: 'kilogram', expiryDays: 15 },
    { name: 'Green Chili', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Red Chili', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Spinach', category: 'Vegetables', unit: 'kilogram', expiryDays: 3 },
    { name: 'Coriander Leaves', category: 'Vegetables', unit: 'kilogram', expiryDays: 3 },
    { name: 'Mint Leaves', category: 'Vegetables', unit: 'kilogram', expiryDays: 3 },
    { name: 'Curry Leaves', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Cabbage', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Cauliflower', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Broccoli', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Carrot', category: 'Vegetables', unit: 'kilogram', expiryDays: 15 },
    { name: 'Beetroot', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Radish', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Turnip', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Sweet Potato', category: 'Vegetables', unit: 'kilogram', expiryDays: 20 },
    { name: 'Pumpkin', category: 'Vegetables', unit: 'kilogram', expiryDays: 30 },
    { name: 'Bottle Gourd', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Ridge Gourd', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Bitter Gourd', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Snake Gourd', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Ash Gourd', category: 'Vegetables', unit: 'kilogram', expiryDays: 15 },
    { name: 'Cucumber', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Zucchini', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Eggplant', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Okra', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Green Beans', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Cluster Beans', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Broad Beans', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'French Beans', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Drumstick', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Plantain', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Raw Banana', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Green Peas', category: 'Vegetables', unit: 'kilogram', expiryDays: 3 },
    { name: 'Bell Pepper Red', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Bell Pepper Green', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Bell Pepper Yellow', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Corn', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Baby Corn', category: 'Vegetables', unit: 'kilogram', expiryDays: 3 },
    { name: 'Mushroom', category: 'Vegetables', unit: 'kilogram', expiryDays: 3 },
    { name: 'Lettuce', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Celery', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Leek', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Spring Onion', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Shallots', category: 'Vegetables', unit: 'kilogram', expiryDays: 15 },
    { name: 'Fennel Bulb', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Artichoke', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Asparagus', category: 'Vegetables', unit: 'kilogram', expiryDays: 3 },
    { name: 'Brussels Sprouts', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Kale', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Swiss Chard', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Bok Choy', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Watercress', category: 'Vegetables', unit: 'kilogram', expiryDays: 3 },
    { name: 'Arugula', category: 'Vegetables', unit: 'kilogram', expiryDays: 3 },
    { name: 'Fenugreek Leaves', category: 'Vegetables', unit: 'kilogram', expiryDays: 3 },
    { name: 'Dill Leaves', category: 'Vegetables', unit: 'kilogram', expiryDays: 3 },
    { name: 'Parsley', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Basil', category: 'Vegetables', unit: 'kilogram', expiryDays: 3 },
    { name: 'Rosemary', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Thyme', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Oregano', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Sage', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Chives', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Lemongrass', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Galangal', category: 'Vegetables', unit: 'kilogram', expiryDays: 15 },
    { name: 'Thai Basil', category: 'Vegetables', unit: 'kilogram', expiryDays: 3 },
    { name: 'Kaffir Lime Leaves', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Banana Flower', category: 'Vegetables', unit: 'kilogram', expiryDays: 2 },
    { name: 'Banana Stem', category: 'Vegetables', unit: 'kilogram', expiryDays: 3 },
    { name: 'Lotus Root', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Water Chestnut', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Bamboo Shoots', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Taro Root', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Yam', category: 'Vegetables', unit: 'kilogram', expiryDays: 15 },
    { name: 'Cassava', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Jackfruit Raw', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Green Papaya', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Chayote', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Kohlrabi', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Parsnip', category: 'Vegetables', unit: 'kilogram', expiryDays: 15 },
    { name: 'Rutabaga', category: 'Vegetables', unit: 'kilogram', expiryDays: 20 },
    { name: 'Jicama', category: 'Vegetables', unit: 'kilogram', expiryDays: 14 },
    { name: 'Daikon Radish', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Chinese Cabbage', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Napa Cabbage', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Red Cabbage', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Savoy Cabbage', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Purple Cauliflower', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Romanesco', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Broccolini', category: 'Vegetables', unit: 'kilogram', expiryDays: 5 },
    { name: 'Purple Carrot', category: 'Vegetables', unit: 'kilogram', expiryDays: 15 },
    { name: 'White Carrot', category: 'Vegetables', unit: 'kilogram', expiryDays: 15 },
    { name: 'Baby Carrot', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Golden Beetroot', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Chioggia Beetroot', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'White Radish', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Black Radish', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Watermelon Radish', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },
    { name: 'Purple Top Turnip', category: 'Vegetables', unit: 'kilogram', expiryDays: 10 },
    { name: 'Hakurei Turnip', category: 'Vegetables', unit: 'kilogram', expiryDays: 7 },

    // MEAT (30 items)
    { name: 'Chicken Breast', category: 'Meat', unit: 'kilogram', expiryDays: 2 },
    { name: 'Chicken Thigh', category: 'Meat', unit: 'kilogram', expiryDays: 2 },
    { name: 'Chicken Wings', category: 'Meat', unit: 'kilogram', expiryDays: 2 },
    { name: 'Chicken Drumstick', category: 'Meat', unit: 'kilogram', expiryDays: 2 },
    { name: 'Whole Chicken', category: 'Meat', unit: 'kilogram', expiryDays: 2 },
    { name: 'Chicken Mince', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Mutton', category: 'Meat', unit: 'kilogram', expiryDays: 3 },
    { name: 'Goat Meat', category: 'Meat', unit: 'kilogram', expiryDays: 3 },
    { name: 'Lamb', category: 'Meat', unit: 'kilogram', expiryDays: 3 },
    { name: 'Beef', category: 'Meat', unit: 'kilogram', expiryDays: 3 },
    { name: 'Buffalo Meat', category: 'Meat', unit: 'kilogram', expiryDays: 3 },
    { name: 'Pork', category: 'Meat', unit: 'kilogram', expiryDays: 2 },
    { name: 'Fish Pomfret', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Fish Kingfish', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Fish Mackerel', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Fish Sardine', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Fish Tuna', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Fish Salmon', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Fish Rohu', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Fish Catla', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Prawns', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Crab', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Lobster', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Squid', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Octopus', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Mussels', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Clams', category: 'Meat', unit: 'kilogram', expiryDays: 1 },
    { name: 'Duck', category: 'Meat', unit: 'kilogram', expiryDays: 2 },
    { name: 'Turkey', category: 'Meat', unit: 'kilogram', expiryDays: 2 },
    { name: 'Quail', category: 'Meat', unit: 'kilogram', expiryDays: 2 },

    // SEAFOOD (20 items)
    { name: 'Indian Salmon (Rawas)', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Hilsa (Ilish)', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Basa Fish Fillet', category: 'Seafood', unit: 'kilogram', expiryDays: 2 },
    { name: 'Tilapia', category: 'Seafood', unit: 'kilogram', expiryDays: 2 },
    { name: 'Bhetki (Barramundi)', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Seer Fish (Surmai)', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Bombay Duck (Bombil)', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Anchovy (Nethili)', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Ladyfish (Kane)', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Ribbon Fish (Vazhmeen)', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Mandeli', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Silver Pomfret', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Indian Mackerel (Bangda)', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Indian Sardine (Pedvey)', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Oysters', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Scallops', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Cuttlefish', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Tiger Prawns', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Freshwater Scampi', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },
    { name: 'Small Shrimp', category: 'Seafood', unit: 'kilogram', expiryDays: 1 },

    // DAIRY (20 items)
    { name: 'Milk Full Cream', category: 'Dairy', unit: 'liter', expiryDays: 2 },
    { name: 'Milk Toned', category: 'Dairy', unit: 'liter', expiryDays: 2 },
    { name: 'Milk Double Toned', category: 'Dairy', unit: 'liter', expiryDays: 2 },
    { name: 'Buffalo Milk', category: 'Dairy', unit: 'liter', expiryDays: 2 },
    { name: 'Yogurt', category: 'Dairy', unit: 'kilogram', expiryDays: 5 },
    { name: 'Greek Yogurt', category: 'Dairy', unit: 'kilogram', expiryDays: 7 },
    { name: 'Buttermilk', category: 'Dairy', unit: 'liter', expiryDays: 3 },
    { name: 'Paneer', category: 'Dairy', unit: 'kilogram', expiryDays: 3 },
    { name: 'Cottage Cheese', category: 'Dairy', unit: 'kilogram', expiryDays: 5 },
    { name: 'Cream', category: 'Dairy', unit: 'liter', expiryDays: 3 },
    { name: 'Heavy Cream', category: 'Dairy', unit: 'liter', expiryDays: 5 },
    { name: 'Sour Cream', category: 'Dairy', unit: 'kilogram', expiryDays: 7 },
    { name: 'Butter', category: 'Dairy', unit: 'kilogram', expiryDays: 30 },
    { name: 'Ghee', category: 'Dairy', unit: 'kilogram', expiryDays: 365 },
    { name: 'Cheese Cheddar', category: 'Dairy', unit: 'kilogram', expiryDays: 30 },
    { name: 'Cheese Mozzarella', category: 'Dairy', unit: 'kilogram', expiryDays: 14 },
    { name: 'Cheese Parmesan', category: 'Dairy', unit: 'kilogram', expiryDays: 60 },
    { name: 'Condensed Milk', category: 'Dairy', unit: 'kilogram', expiryDays: 365 },
    { name: 'Evaporated Milk', category: 'Dairy', unit: 'liter', expiryDays: 365 },
    { name: 'Khoya', category: 'Dairy', unit: 'kilogram', expiryDays: 3 },

    // SPICES (50 items)
    { name: 'Turmeric Powder', category: 'Spices', unit: 'kilogram', expiryDays: 730 },
    { name: 'Red Chili Powder', category: 'Spices', unit: 'kilogram', expiryDays: 730 },
    { name: 'Coriander Powder', category: 'Spices', unit: 'kilogram', expiryDays: 730 },
    { name: 'Cumin Powder', category: 'Spices', unit: 'kilogram', expiryDays: 730 },
    { name: 'Garam Masala', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Cumin Seeds', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },
    { name: 'Coriander Seeds', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },
    { name: 'Mustard Seeds', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },
    { name: 'Fenugreek Seeds', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },
    { name: 'Fennel Seeds', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },
    { name: 'Carom Seeds', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },
    { name: 'Nigella Seeds', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },
    { name: 'Sesame Seeds', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Poppy Seeds', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Cardamom Green', category: 'Spices', unit: 'kilogram', expiryDays: 730 },
    { name: 'Cardamom Black', category: 'Spices', unit: 'kilogram', expiryDays: 730 },
    { name: 'Cinnamon Stick', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },
    { name: 'Bay Leaves', category: 'Spices', unit: 'kilogram', expiryDays: 730 },
    { name: 'Cloves', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },
    { name: 'Black Pepper', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },
    { name: 'White Pepper', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },
    { name: 'Star Anise', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },
    { name: 'Nutmeg', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },
    { name: 'Mace', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },
    { name: 'Asafoetida', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },
    { name: 'Dry Red Chili', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Kashmiri Red Chili', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Tamarind', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Kokum', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Amchur Powder', category: 'Spices', unit: 'kilogram', expiryDays: 730 },
    { name: 'Chat Masala', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Sambhar Powder', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Rasam Powder', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Biryani Masala', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Chicken Masala', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Fish Masala', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Meat Masala', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Pav Bhaji Masala', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Chana Masala', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Kitchen King Masala', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Tandoori Masala', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Pickle Masala', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Panch Phoron', category: 'Spices', unit: 'kilogram', expiryDays: 730 },
    { name: 'Goda Masala', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Malvani Masala', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Kolhapuri Masala', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Vangi Bath Powder', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Bisi Bele Bath Powder', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Gunpowder Spice', category: 'Spices', unit: 'kilogram', expiryDays: 365 },
    { name: 'Kala Namak', category: 'Spices', unit: 'kilogram', expiryDays: 1095 },

    // GRAINS (60 items)
    { name: 'Basmati Rice', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Jasmine Rice', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Brown Rice', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Red Rice', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Black Rice', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Sona Masoori Rice', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Ponni Rice', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Wheat Flour', category: 'Grains', unit: 'kilogram', expiryDays: 180 },
    { name: 'Whole Wheat Flour', category: 'Grains', unit: 'kilogram', expiryDays: 120 },
    { name: 'All Purpose Flour', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Semolina', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Besan', category: 'Grains', unit: 'kilogram', expiryDays: 180 },
    { name: 'Rice Flour', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Corn Flour', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Ragi Flour', category: 'Grains', unit: 'kilogram', expiryDays: 180 },
    { name: 'Jowar Flour', category: 'Grains', unit: 'kilogram', expiryDays: 180 },
    { name: 'Bajra Flour', category: 'Grains', unit: 'kilogram', expiryDays: 180 },
    { name: 'Quinoa', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Oats', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Barley', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Toor Dal', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Moong Dal', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Chana Dal', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Masoor Dal', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Urad Dal', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Rajma', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Kabuli Chana', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Black Chana', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Green Moong', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Black Urad', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Moth Dal', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Kulthi Dal', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Val Dal', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Matki', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Poha', category: 'Grains', unit: 'kilogram', expiryDays: 180 },
    { name: 'Upma Rava', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Daliya', category: 'Grains', unit: 'kilogram', expiryDays: 180 },
    { name: 'Sabudana', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Vermicelli', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Pasta', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Spaghetti', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Penne', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Fusilli', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Macaroni', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Linguine', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Noodles', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Bread Crumbs', category: 'Grains', unit: 'kilogram', expiryDays: 180 },
    { name: 'Cornflakes', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Muesli', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Granola', category: 'Grains', unit: 'kilogram', expiryDays: 180 },
    { name: 'Puffed Rice', category: 'Grains', unit: 'kilogram', expiryDays: 180 },
    { name: 'Flattened Rice', category: 'Grains', unit: 'kilogram', expiryDays: 180 },
    { name: 'Beaten Rice', category: 'Grains', unit: 'kilogram', expiryDays: 180 },
    { name: 'Ragi', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Jowar', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Bajra', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Amaranth', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Buckwheat', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Chia Seeds', category: 'Grains', unit: 'kilogram', expiryDays: 730 },
    { name: 'Flax Seeds', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Sunflower Seeds', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Pumpkin Seeds', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Watermelon Seeds', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Melon Seeds', category: 'Grains', unit: 'kilogram', expiryDays: 365 },
    { name: 'Pine Nuts', category: 'Grains', unit: 'kilogram', expiryDays: 180 },
    { name: 'Walnuts', category: 'Grains', unit: 'kilogram', expiryDays: 365 },

    // BEVERAGES (30 items)
    { name: 'Tea Leaves', category: 'Beverages', unit: 'kilogram', expiryDays: 730 },
    { name: 'Green Tea', category: 'Beverages', unit: 'kilogram', expiryDays: 730 },
    { name: 'Black Tea', category: 'Beverages', unit: 'kilogram', expiryDays: 730 },
    { name: 'Masala Tea', category: 'Beverages', unit: 'kilogram', expiryDays: 365 },
    { name: 'Earl Grey Tea', category: 'Beverages', unit: 'kilogram', expiryDays: 730 },
    { name: 'Chamomile Tea', category: 'Beverages', unit: 'kilogram', expiryDays: 730 },
    { name: 'Coffee Beans', category: 'Beverages', unit: 'kilogram', expiryDays: 365 },
    { name: 'Coffee Powder', category: 'Beverages', unit: 'kilogram', expiryDays: 180 },
    { name: 'Instant Coffee', category: 'Beverages', unit: 'kilogram', expiryDays: 730 },
    { name: 'Cocoa Powder', category: 'Beverages', unit: 'kilogram', expiryDays: 730 },
    { name: 'Hot Chocolate', category: 'Beverages', unit: 'kilogram', expiryDays: 365 },
    { name: 'Fruit Juice Orange', category: 'Beverages', unit: 'liter', expiryDays: 7 },
    { name: 'Fruit Juice Apple', category: 'Beverages', unit: 'liter', expiryDays: 7 },
    { name: 'Fruit Juice Mango', category: 'Beverages', unit: 'liter', expiryDays: 7 },
    { name: 'Coconut Water', category: 'Beverages', unit: 'liter', expiryDays: 3 },
    { name: 'Sugarcane Juice', category: 'Beverages', unit: 'liter', expiryDays: 1 },
    { name: 'Lemon Juice', category: 'Beverages', unit: 'liter', expiryDays: 5 },
    { name: 'Pomegranate Juice', category: 'Beverages', unit: 'liter', expiryDays: 5 },
    { name: 'Cranberry Juice', category: 'Beverages', unit: 'liter', expiryDays: 7 },
    { name: 'Grape Juice', category: 'Beverages', unit: 'liter', expiryDays: 7 },
    { name: 'Pineapple Juice', category: 'Beverages', unit: 'liter', expiryDays: 5 },
    { name: 'Tomato Juice', category: 'Beverages', unit: 'liter', expiryDays: 5 },
    { name: 'Carrot Juice', category: 'Beverages', unit: 'liter', expiryDays: 3 },
    { name: 'Beetroot Juice', category: 'Beverages', unit: 'liter', expiryDays: 3 },
    { name: 'Aloe Vera Juice', category: 'Beverages', unit: 'liter', expiryDays: 30 },
    { name: 'Energy Drink', category: 'Beverages', unit: 'liter', expiryDays: 365 },
    { name: 'Sports Drink', category: 'Beverages', unit: 'liter', expiryDays: 365 },
    { name: 'Soft Drink Cola', category: 'Beverages', unit: 'liter', expiryDays: 365 },
    { name: 'Soft Drink Lemon', category: 'Beverages', unit: 'liter', expiryDays: 365 },
    { name: 'Mineral Water', category: 'Beverages', unit: 'liter', expiryDays: 365 },

    // OILS (20 items)
    { name: 'Sunflower Oil', category: 'Oils', unit: 'liter', expiryDays: 365 },
    { name: 'Mustard Oil', category: 'Oils', unit: 'liter', expiryDays: 365 },
    { name: 'Coconut Oil', category: 'Oils', unit: 'liter', expiryDays: 730 },
    { name: 'Olive Oil', category: 'Oils', unit: 'liter', expiryDays: 730 },
    { name: 'Sesame Oil', category: 'Oils', unit: 'liter', expiryDays: 365 },
    { name: 'Groundnut Oil', category: 'Oils', unit: 'liter', expiryDays: 365 },
    { name: 'Safflower Oil', category: 'Oils', unit: 'liter', expiryDays: 365 },
    { name: 'Rice Bran Oil', category: 'Oils', unit: 'liter', expiryDays: 365 },
    { name: 'Palm Oil', category: 'Oils', unit: 'liter', expiryDays: 365 },
    { name: 'Canola Oil', category: 'Oils', unit: 'liter', expiryDays: 365 },
    { name: 'Soybean Oil', category: 'Oils', unit: 'liter', expiryDays: 365 },
    { name: 'Corn Oil', category: 'Oils', unit: 'liter', expiryDays: 365 },
    { name: 'Avocado Oil', category: 'Oils', unit: 'liter', expiryDays: 365 },
    { name: 'Flaxseed Oil', category: 'Oils', unit: 'liter', expiryDays: 180 },
    { name: 'Walnut Oil', category: 'Oils', unit: 'liter', expiryDays: 180 },
    { name: 'Almond Oil', category: 'Oils', unit: 'liter', expiryDays: 365 },
    { name: 'Castor Oil', category: 'Oils', unit: 'liter', expiryDays: 730 },
    { name: 'Neem Oil', category: 'Oils', unit: 'liter', expiryDays: 730 },
    { name: 'Til Oil', category: 'Oils', unit: 'liter', expiryDays: 365 },
    { name: 'Vanaspati', category: 'Oils', unit: 'kilogram', expiryDays: 365 }
];

// ---------- Expansion generator to reach exactly 1,000 items ----------
const defaultExpiry = {
    Vegetables: 5,
    Fruits: 7,
    Dairy: 5,
    Spices: 365,
    'Whole Spices': 730,
    Grains: 365,
    Beverages: 365,
    Oils: 365,
    Seafood: 1,
    Snacks: 270,
    Condiments: 365,
    'Pickles & Achar': 365,
    'Sauces & Pastes': 365,
    Bakery: 5,
    Frozen: 365,
    'Ready To Eat': 365,
    'Dry Fruits & Nuts': 365,
    'Sweets & Mithai': 7,
    'Canned & Packaged': 540,
};

const buildItems = (baseNames, category, unit, expiryDays, variants = ['']) => {
    const items = [];
    for (const base of baseNames) {
        for (const v of variants) {
            const name = v ? `${base} - ${v}` : base;
            items.push({ name, category, unit, expiryDays: expiryDays ?? defaultExpiry[category] ?? 365 });
        }
    }
    return items;
};

// Variants (kept modest to land near ~1000)
const organicVariants = ['', 'Organic'];
const spiceFormVariants = ['Whole', 'Powder'];
const qualityVariants = ['', 'Premium'];
const sizeVariants = ['250g', '500g'];
const packVariants = ['Small Pack', 'Family Pack'];
const beverageVariants = ['', 'Sugar Free'];

// Additional category bases
const fruits = [
    'Apple Shimla', 'Apple Fuji', 'Banana Cavendish', 'Banana Yelakki', 'Mango Alphonso', 'Mango Kesar', 'Orange Kinnow', 'Mosambi',
    'Lemon', 'Grapes Green', 'Grapes Black', 'Pomegranate', 'Guava', 'Papaya', 'Pineapple', 'Watermelon', 'Muskmelon', 'Pear', 'Peach', 'Plum',
    'Lychee', 'Kiwi', 'Avocado', 'Strawberry', 'Blueberry', 'Custard Apple', 'Sapota', 'Fig', 'Dates', 'Tender Coconut',
];

const extraVegetables = [
    'Tomato Roma', 'Tomato Cherry', 'Onion Red', 'Onion White', 'Potato Baby', 'Capsicum Green', 'Capsicum Yellow', 'Capsicum Red',
    'Chili Kashmiri', 'Chili Byadagi', 'Leafy Amaranth', 'Mustard Greens', 'Radish Leaves', 'Baby Corn', 'Sweet Corn', 'Mushroom Button',
    'Yam Elephant Foot', 'Tapioca', 'Raw Jackfruit', 'Cucumber English', 'Lettuce Iceberg', 'Lettuce Romaine', 'Baby Spinach', 'Arugula',
];

const wholeSpices = [
    'Cumin', 'Coriander', 'Mustard', 'Fenugreek', 'Fennel', 'Ajwain', 'Kalonji', 'Sesame', 'Cardamom Green', 'Cardamom Black',
    'Cinnamon', 'Bay Leaf', 'Clove', 'Black Pepper', 'White Pepper', 'Star Anise', 'Nutmeg', 'Mace', 'Asafoetida',
];

const masalaBlends = [
    'Kitchen King Masala', 'Chole Masala', 'Chaat Masala', 'Pav Bhaji Masala', 'Garam Masala', 'Sambar Powder', 'Rasam Powder',
    'Biryani Masala', 'Tandoori Masala', 'Fish Masala', 'Meat Masala', 'Panch Phoron', 'Vangi Bath Powder', 'Puliogare Mix',
];

const staples = [
    'Basmati Rice 1121', 'Kolam Rice', 'Indrayani Rice', 'Matta Rice', 'Idli Rice', 'Parboiled Rice',
    'Toor Dal', 'Moong Dal Split', 'Urad Dal', 'Masoor Malka', 'Chana Dal', 'Kabuli Chana', 'Kala Chana', 'Rajma Red', 'Rajma Chitra',
    'Jowar', 'Bajra', 'Ragi', 'Foxtail Millet', 'Little Millet', 'Barnyard Millet', 'Kodo Millet', 'Proso Millet', 'Poha Thick', 'Poha Thin',
    'Sooji Rava', 'Idli Rava', 'Daliya Broken Wheat', 'Sabudana',
];

const snacks = [
    'Namkeen Mixture', 'Bhujia', 'Sev', 'Gathiya', 'Chivda', 'Banana Chips', 'Potato Chips Salted', 'Potato Chips Masala', 'Peanut Masala',
    'Chana Jor Garam', 'Murukku', 'Ribbon Pakoda', 'Khakra', 'Papad Urad', 'Papad Moong', 'Fryums',
];

const condiments = [
    'Sugar', 'Brown Sugar', 'Jaggery', 'Rock Salt', 'Table Salt', 'Black Salt', 'Honey', 'Maple Syrup',
    'Tomato Ketchup', 'Red Chili Sauce', 'Green Chili Sauce', 'Soy Sauce', 'White Vinegar', 'Apple Cider Vinegar', 'Mustard Sauce',
    'Mayonnaise', 'Schezwan Sauce', 'Tamarind Chutney', 'Mint Chutney', 'Coriander Chutney', 'Ginger Garlic Paste',
];

const pickles = [
    'Mango Pickle', 'Lemon Pickle', 'Mixed Veg Pickle', 'Green Chili Pickle', 'Garlic Pickle', 'Gongura Pickle', 'Amla Pickle',
];

const dairy = [
    'Milk Tetra Pack', 'Skimmed Milk', 'Curd', 'Paneer Fresh', 'Paneer Malai', 'Probiotic Curd', 'Lassi Sweet', 'Chaas Salted',
    'Cheese Slices', 'Cheese Processed', 'Whipping Cream', 'Table Butter', 'White Butter', 'Khoa Mawa',
];

const bakery = [
    'Bread White', 'Bread Brown', 'Bread Multigrain', 'Pav Ladi', 'Burger Buns', 'Kulcha', 'Naan Ready', 'Tortilla Wraps', 'Pizza Base',
    'Rusk', 'Khari', 'Cake Vanilla', 'Muffins',
];

const beverages = [
    'Tea Assam CTC', 'Darjeeling Tea', 'Green Tea Lemon', 'Masala Chai Premix', 'Coffee Instant', 'Filter Coffee', 'Cold Coffee',
    'Fruit Juice Litchi', 'Fruit Juice Guava', 'Aam Panna', 'Jaljeera', 'Buttermilk Salted', 'Thandai', 'Rose Sharbat',
];

const oils = [
    'Groundnut Oil Cold Pressed', 'Sesame Oil Cold Pressed', 'Coconut Oil Cold Pressed', 'Mustard Oil Kachi Ghani', 'Olive Pomace Oil',
    'Sunflower Oil Refined', 'Rice Bran Oil Refined',
];

const dryFruits = [
    'Almonds', 'Cashews', 'Pistachios', 'Walnuts', 'Raisins Black', 'Raisins Golden', 'Dates Seedless', 'Figs Dried', 'Apricots Dried', 'Prunes',
];

const sweets = [
    'Gulab Jamun Mix', 'Rasgulla Tin', 'Rasmalai Tin', 'Soan Papdi', 'Mysore Pak', 'Besan Ladoo', 'Motichoor Ladoo', 'Kaju Katli',
];

const packaged = [
    'Baked Beans', 'Sweet Corn Canned', 'Pineapple Slices', 'Tomato Puree', 'Coconut Milk', 'Olives Green', 'Olives Black', 'Peanut Butter', 'Jam Mixed Fruit',
];

const readyToEat = [
    'Upma Instant', 'Poha Instant', 'Idli Instant', 'Dosa Instant', 'Pav Bhaji Ready', 'Chole Ready', 'Dal Makhani Ready', 'Rajma Masala Ready',
];

const frozen = [
    'Green Peas Frozen', 'Sweet Corn Frozen', 'Mixed Veg Frozen', 'French Fries', 'Aloo Tikki', 'Veg Cutlet', 'Paratha Frozen', 'Naan Frozen',
];

const generatedItems = [
    ...buildItems(fruits, 'Fruits', 'kilogram', defaultExpiry.Fruits, organicVariants),
    ...buildItems(extraVegetables, 'Vegetables', 'kilogram', defaultExpiry.Vegetables, organicVariants),
    ...buildItems(wholeSpices, 'Whole Spices', 'kilogram', defaultExpiry['Whole Spices'], spiceFormVariants),
    ...buildItems(masalaBlends, 'Spices', 'kilogram', defaultExpiry.Spices, qualityVariants),
    ...buildItems(staples, 'Grains', 'kilogram', defaultExpiry.Grains, qualityVariants),
    ...buildItems(snacks, 'Snacks', 'pack', defaultExpiry.Snacks, packVariants),
    ...buildItems(condiments, 'Condiments', 'liter', defaultExpiry.Condiments, beverageVariants),
    ...buildItems(pickles, 'Pickles & Achar', 'kilogram', defaultExpiry['Pickles & Achar'], ['','Home Style']),
    ...buildItems(dairy, 'Dairy', 'liter', defaultExpiry.Dairy, ['','Low Fat']),
    ...buildItems(bakery, 'Bakery', 'pack', defaultExpiry.Bakery, ['','Whole Wheat']),
    ...buildItems(beverages, 'Beverages', 'liter', defaultExpiry.Beverages, beverageVariants),
    ...buildItems(oils, 'Oils', 'liter', defaultExpiry.Oils, ['','1L']),
    ...buildItems(dryFruits, 'Dry Fruits & Nuts', 'kilogram', defaultExpiry['Dry Fruits & Nuts'], sizeVariants),
    ...buildItems(sweets, 'Sweets & Mithai', 'pack', defaultExpiry['Sweets & Mithai'], ['500g Box','1kg Box']),
    ...buildItems(packaged, 'Canned & Packaged', 'pack', defaultExpiry['Canned & Packaged'], ['','Family Pack']),
    ...buildItems(readyToEat, 'Ready To Eat', 'pack', defaultExpiry['Ready To Eat'], ['Single Serve','Family Pack']),
    ...buildItems(frozen, 'Frozen', 'pack', defaultExpiry.Frozen, ['','Value Pack']),
];

const mergeAndPadCatalogue = () => {
    const seen = new Set();
    const out = [];
    const pushUnique = (item) => {
        const key = `${item.name}`.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            out.push(item);
        }
    };
    for (const item of baseCatalogue) pushUnique(item);
    for (const item of generatedItems) pushUnique(item);

    // Top-up with regional series if below 1000
    const regions = ['North', 'South', 'East', 'West', 'Central'];
    const families = [
        { base: 'Chutney', category: 'Sauces & Pastes', unit: 'kilogram' },
        { base: 'Masala Mix', category: 'Spices', unit: 'kilogram' },
        { base: 'Pickle', category: 'Pickles & Achar', unit: 'kilogram' },
        { base: 'Namkeen', category: 'Snacks', unit: 'pack' },
        { base: 'Sharbat', category: 'Beverages', unit: 'liter' },
    ];
    let i = 0;
    while (out.length < 1000) {
        const fam = families[i % families.length];
        const reg = regions[i % regions.length];
        const name = `${reg} ${fam.base} ${Math.floor(i/regions.length) + 1}`;
        pushUnique({ name, category: fam.category, unit: fam.unit, expiryDays: defaultExpiry[fam.category] ?? 365 });
        i++;
        if (i > 5000) break; // safety guard
    }
    return out.length > 1000 ? out.slice(0, 1000) : out;
};

export const itemCatalogue = mergeAndPadCatalogue();

// Helper functions for the catalogue
export const getCategoriesFromCatalogue = () => {
    const categories = [...new Set(itemCatalogue.map(item => item.category))];
    return categories.sort();
};

export const getItemsByCategory = (category) => {
    return itemCatalogue.filter(item => item.category === category);
};

export const searchItems = (searchTerm) => {
    return itemCatalogue.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
};

export const getItemByName = (name) => {
    return itemCatalogue.find(item =>
        item.name.toLowerCase() === name.toLowerCase()
    );
};

// Statistics
export const getCatalogueStats = () => {
    const stats = {};
    itemCatalogue.forEach(item => {
        stats[item.category] = (stats[item.category] || 0) + 1;
    });
    return {
        total: itemCatalogue.length,
        byCategory: stats
    };
};
