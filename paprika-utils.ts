import * as v from "valibot"; // 1.2 kB

export const paprikaJsonExample = {
  name: "Beef and Vegetable Soup",
  description: "This is a nice soup",
  directions: [
    "1. Combine the main ingredients in a stockpot along with the corn, onion, garlic, mint, and cilantro. Add enough water to cover the ingredients.",
    "2. Turn the heat to low and simmer for about 2 hours or until the meat is tender, skimming off any foam that forms on the surface.",
    "3. Increase the heat to bring the broth back to a simmering point.",
    "4. Add the carrots and chayote and cook for about 15 minutes.",
    "5. Add the potatoes and cook for 10 more minutes, making sure all the vegetables are still al dente.",
    "6. Add the remaining vegetables, tomato sauce (if using), garbanzo beans (if using), and salt, and let the broth simmer until all the vegetables are cooked.",
    "7. Serve the soup in large bowls and garnish with cilantro.",
  ],
  ingredients: [
    "2 pounds (900 g) bone-in beef shank",
    "1½ pounds (675 g) beef marrow bones",
    "2 ears corn, cut into thirds or quarters",
    "4 cloves garlic",
    "2 sprigs fresh mint",
    "6 sprigs fresh cilantro",
  ],
  notes: [
    "Page PAGE NUMBER",
    "* Other cuts of meat you can use are beef short ribs and beef chuck cut into large cubes.",
    "* I usually cook the meat in a pressure cooker or instant Pot first for 35 minutes, then remove the meat and the broth (with the foam skimmed off). Doing this will save you a lot of time.",
    "* In some regions of Mexico, cooks add the tomato sauce to the broth (this is the way I grew up eating this soup). You can skip this if you like; either way, it will turn out delicious.",
  ],

  categories: ["SOUPS"],
  prep_time: "20 minutes (or whatever)",
  cook_time: "2 hours 30 minutes",
  servings: "6 or whatever",
  created: null,
  hash: null,
  image_url: null,
  nutritional_info: null,
  photo_hash: null,
  photo: null,
  rating: null,
  scale: null,
  source_url: null,
  source: "The Mexican Home Cookbook",
  uid: null,
};
export const paprikaExampleWithoutNulls = Object.entries(
  paprikaJsonExample
).reduce((acc: Record<string, any>, [key, value]) => {
  if (value !== null) {
    acc[key] = value;
  }
  return acc;
}, {});

export const paprikaJsonExampleWithIngredientsBySection = {
  ...paprikaExampleWithoutNulls,
  ingredients: {
    MAIN: [
      "2 pounds (900 g) bone-in beef shank",
      "1½ pounds (675 g) beef marrow bones",
      "2 ears corn, cut into thirds or quarters",
    ],
    SAUCE: [
      "4 cloves garlic",
      "2 sprigs fresh mint",
      "6 sprigs fresh cilantro",
    ],
    OPTIONAL: ["2 sprigs fresh mint"],
  },
};

export const recipeSchema = v.object({
  name: v.string(),
  description: v.string(),
  directions: v.array(v.string()),
  ingredients: v.record(v.string(), v.array(v.string())),
  notes: v.array(v.string()),
  categories: v.array(v.string()),
  prep_time: v.string(),
  cook_time: v.optional(v.nullable(v.string())),
  servings: v.string(),
  source: v.string(),
  created: v.optional(v.string()),
  hash: v.optional(v.string()),
  image_url: v.optional(v.string()),
  nutritional_info: v.optional(v.string()),
  photo_large: v.optional(v.string()),
  photo_hash: v.optional(v.string()),
  photo: v.optional(v.string()),
  rating: v.optional(v.string()),
  scale: v.optional(v.string()),
  source_url: v.optional(v.string()),
  uid: v.optional(v.string()),
});

export const recipePayloadSchema = v.object({
  categories: v.array(v.string()),
  cook_time: v.string(),
  created: v.string(),
  description: v.string(),
  // deleted: v.literal(false),
  difficulty: v.string(),
  directions: v.string(),
  hash: v.optional(v.string()),
  image_url: v.nullable(v.string()),
  in_trash: v.literal(false),
  is_pinned: v.literal(false),
  ingredients: v.string(),
  name: v.string(),
  notes: v.string(),
  nutritional_info: v.string(),
  on_favorites: v.literal(false),
  on_grocery_list: v.nullable(v.boolean()),
  photo: v.string(),
  photo_hash: v.string(),
  photo_url: v.nullable(v.string()),
  photo_large: v.nullable(v.string()),
  prep_time: v.string(),
  rating: v.literal(0),
  scale: v.nullable(v.string()),
  servings: v.string(),
  source_url: v.string(),
  source: v.string(),
  total_time: v.string(),
  uid: v.pipe(v.string(), v.toUpperCase()),
});

export type Recipe = v.InferOutput<typeof recipePayloadSchema>;
// export type Recipe = {
//   categories: string[];
//   cook_time: string;
//   created: string;
//   description: string;
//   difficulty: string;
//   directions: string;
//   deleted: boolean;
//   hash?: string;
//   image_url: string | null;
//   ingredients: string;
//   // in_trash: boolean;
//   // is_pinned: boolean;
//   name: string;
//   notes: string;
//   nutritional_info: string;
//   on_favorites: boolean;
//   photo_hash: string | null;
//   photo: string | null;
//   photo_large?: string | null;
//   photo_url: null | string;
//   prep_time: string;
//   rating: 0;
//   scale: string | null;
//   servings: string;
//   source_url: string;
//   source: string;
//   total_time: string;
//   uid: string;
// };
export const blankRecipe: Recipe = {
  categories: [],
  cook_time: "",
  created: "",
  // deleted: false,
  difficulty: "",
  description: "",
  directions: "",
  hash: "",
  image_url: "",
  in_trash: false,
  ingredients: "",
  is_pinned: false,
  name: "",
  notes: "",
  nutritional_info: "",
  on_favorites: false,
  on_grocery_list: null,
  photo_hash: "",
  photo_large: null,
  photo_url: null,
  photo: "",
  prep_time: "",
  rating: 0,
  scale: null,
  servings: "",
  source_url: "",
  source: "",
  total_time: "",
  uid: "",
};

// working example
/* 
  const hardCodeText = {
       categories: [],
       cook_time: "",
       created: "2024-07-31 16:42:31",
       description: "",
       difficulty: "",
       directions: "",
       hash: "720441371ebc73a6e65b28dd4c09eadd9117b51193eb88a486e0497524dad43d",
       image_url: "",
       in_trash: false,
       ingredients: "",
       is_pinned: false,
       name: "Debug",
       notes: "",
       nutritional_info: "",
       on_favorites: false,
       on_grocery_list: null,
       photo_hash: "",
       photo_large: null,
       photo_url: null,
       photo: "",
       prep_time: "",
       rating: 0,
       scale: null,
       servings: "",
       source_url: "",
       source: "",
       total_time: "",
       uid: "F116DA72-66A9-4FEF-99F9-6C378B9801E6",
     };
*/
