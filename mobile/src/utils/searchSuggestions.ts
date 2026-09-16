// Utility for generating category-based and audience-based search suggestions

export interface SuggestionCategoryRule {
  keys: string[];
  productSuggestions: string[];
  aiSuggestions: string[];
}

const CATEGORY_RULES: SuggestionCategoryRule[] = [
  {
    keys: ['shirt', 'shirts', 'tshirt', 't-shirt', 'tee', 'tees', 'top', 'tops', 'shi'],
    productSuggestions: [
      'Shirt for Kids',
      'Shirt for Men',
      'Shirt for Women',
      'Casual Shirts',
      'Formal Shirts',
    ],
    aiSuggestions: [
      'Show me shirts for men',
      'Show me shirts for women',
      'Show me shirts for kids',
      'Show me trending shirt designs',
    ],
  },
  {
    keys: ['dress', 'dresses', 'gown', 'gowns', 'frock', 'frocks', 'dre'],
    productSuggestions: [
      'Dress for Kids',
      'Dress for Women',
      'Casual Dresses',
      'Party Dresses',
      'Summer Dresses',
    ],
    aiSuggestions: [
      'Show me dresses for women',
      'Show me dresses for kids',
      'Show me casual dresses',
      'Show me party dresses',
    ],
  },
  {
    keys: ['shoes', 'shoe', 'footwear', 'sneaker', 'sneakers', 'boots', 'boot', 'sho', 'sne'],
    productSuggestions: [
      'Shoes for Kids',
      'Shoes for Men',
      'Shoes for Women',
      'Sports Shoes',
      'Casual Shoes',
    ],
    aiSuggestions: [
      'Show me shoes for men',
      'Show me shoes for women',
      'Show me shoes for kids',
      'Show me sports shoes',
    ],
  },
  {
    keys: ['jacket', 'jackets', 'coat', 'coats', 'blazer', 'blazers', 'outerwear', 'jac', 'coa'],
    productSuggestions: [
      'Jackets for Kids',
      'Jackets for Men',
      'Jackets for Women',
      'Winter Jackets',
      'Casual Jackets',
    ],
    aiSuggestions: [
      'Show me jackets for men',
      'Show me jackets for women',
      'Show me jackets for kids',
      'Show me winter jackets',
    ],
  },
  {
    keys: ['pants', 'pant', 'trouser', 'trousers', 'bottom', 'bottoms', 'pan', 'tro'],
    productSuggestions: [
      'Pants for Kids',
      'Pants for Men',
      'Pants for Women',
      'Formal Pants',
      'Casual Pants',
    ],
    aiSuggestions: [
      'Show me pants for men',
      'Show me pants for women',
      'Show me pants for kids',
      'Show me formal pants',
    ],
  },
  {
    keys: ['jeans', 'jean', 'denim', 'jea', 'den'],
    productSuggestions: [
      'Jeans for Kids',
      'Jeans for Men',
      'Jeans for Women',
      'Slim Fit Jeans',
      'Baggy Jeans',
    ],
    aiSuggestions: [
      'Show me jeans for men',
      'Show me jeans for women',
      'Show me jeans for kids',
      'Show me trending jeans styles',
    ],
  },
  {
    keys: ['sweater', 'sweaters', 'cardigan', 'hoodie', 'hoodies', 'sweatshirt', 'swe'],
    productSuggestions: [
      'Sweaters for Kids',
      'Sweaters for Men',
      'Sweaters for Women',
      'Winter Sweaters',
      'Knit Sweaters',
    ],
    aiSuggestions: [
      'Show me sweaters for men',
      'Show me sweaters for women',
      'Show me sweaters for kids',
      'Show me cozy winter sweaters',
    ],
  },
  {
    keys: ['suit', 'suits', 'tuxedo', 'sui'],
    productSuggestions: [
      'Suits for Men',
      'Suits for Women',
      'Formal Suits',
      'Designer Blazers',
      'Italian Wool Suits',
    ],
    aiSuggestions: [
      'Show me suits for men',
      'Show me suits for women',
      'Show me formal suits',
      'Show me Italian tailored suits',
    ],
  },
  {
    keys: ['skirt', 'skirts', 'ski'],
    productSuggestions: [
      'Skirts for Kids',
      'Skirts for Women',
      'Casual Skirts',
      'Pleated Skirts',
      'Midi Skirts',
    ],
    aiSuggestions: [
      'Show me skirts for women',
      'Show me skirts for kids',
      'Show me casual skirts',
      'Show me pleated skirts',
    ],
  },
  {
    keys: ['accessories', 'accessory', 'bag', 'bags', 'handbag', 'handbags', 'watch', 'acc'],
    productSuggestions: [
      'Accessories for Women',
      'Accessories for Men',
      'Accessories for Kids',
      'Luxury Handbags',
      'Trending Jewelry',
    ],
    aiSuggestions: [
      'Show me accessories for women',
      'Show me accessories for men',
      'Show me luxury handbags',
      'Show me trending accessories',
    ],
  },
  {
    keys: ['kids', 'kid', 'children', 'boy', 'boys', 'girl', 'girls'],
    productSuggestions: [
      'Clothes for Kids',
      'Shoes for Kids',
      'Shirt for Kids',
      'Dress for Kids',
      'Jackets for Kids',
    ],
    aiSuggestions: [
      'Show me outfits for kids',
      'Show me shoes for kids',
      'Show me shirts for kids',
      'Show me dresses for kids',
    ],
  },
  {
    keys: ['men', 'mens', 'man'],
    productSuggestions: [
      'Clothes for Men',
      'Shirt for Men',
      'Shoes for Men',
      'Jackets for Men',
      'Pants for Men',
    ],
    aiSuggestions: [
      'Show me outfits for men',
      'Show me shirts for men',
      'Show me shoes for men',
      'Show me jackets for men',
    ],
  },
  {
    keys: ['women', 'womens', 'woman', 'wom', 'ladies'],
    productSuggestions: [
      'Clothes for Women',
      'Dress for Women',
      'Shirt for Women',
      'Shoes for Women',
      'Jackets for Women',
    ],
    aiSuggestions: [
      'Show me outfits for women',
      'Show me dresses for women',
      'Show me shirts for women',
      'Show me shoes for women',
    ],
  },
  {
    keys: ['trend', 'trending', 'trends', 'design', 'designs', 'popular'],
    productSuggestions: [
      'Trending for Women',
      'Trending for Men',
      'Trending for Kids',
      'Trending Dresses',
      'Trending Shoes',
    ],
    aiSuggestions: [
      'Give me trending designs',
      'Show me trending outfits for men',
      'Show me trending outfits for women',
      'Show me trending fashion for kids',
    ],
  },
];

function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Generates product search suggestions directly relevant to the user's input keyword.
 * Prioritizes:
 * 1. Kids
 * 2. Men
 * 3. Women
 * 4. Product type / style variations
 */
export function getProductSearchSuggestions(rawQuery: string): string[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query || query.length < 2) return [];

  // Look for curated rule matches
  for (const rule of CATEGORY_RULES) {
    if (rule.keys.some((k) => query === k || (k.startsWith(query) && query.length >= 2) || (query.startsWith(k) && k.length >= 3))) {
      return rule.productSuggestions;
    }
  }

  // Dynamic fallback for any other keyword
  const capitalized = capitalize(query);
  return [
    `${capitalized} for Kids`,
    `${capitalized} for Men`,
    `${capitalized} for Women`,
    `Casual ${capitalized}`,
    `Trending ${capitalized}`,
  ];
}

/**
 * Generates conversational query completions for AI Stylist.
 */
export function getAiStylistSuggestions(rawQuery: string): string[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query || query.length < 2) return [];

  // Look for curated rule matches
  for (const rule of CATEGORY_RULES) {
    if (rule.keys.some((k) => query === k || (k.startsWith(query) && query.length >= 2) || (query.startsWith(k) && k.length >= 3))) {
      return rule.aiSuggestions;
    }
  }

  // Dynamic fallback for any other keyword
  const lower = query.toLowerCase();
  return [
    `Show me ${lower} for men`,
    `Show me ${lower} for women`,
    `Show me ${lower} for kids`,
    `Show me trending ${lower} designs`,
  ];
}
