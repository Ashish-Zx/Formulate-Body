export type MealPreset = {
  id: string;
  mealSlot: string;
  foodName: string;
  portion: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

// No-fish South Asian presets (from coach-data/nutrition.md)
export const MEAL_PRESETS: MealPreset[] = [
  {
    id: "breakfast-eggs-oats",
    mealSlot: "Breakfast",
    foodName: "3 Whole Eggs + 2 Egg Whites + 60g Oats + Banana",
    portion: "full meal",
    calories: 559,
    proteinG: 32,
    fatG: 19,
    carbsG: 65,
  },
  {
    id: "lunch-dal-bhat-chicken",
    mealSlot: "Lunch",
    foodName: "150g Chicken Breast + 200g Rice + 100g Dal + Salad",
    portion: "full meal (1 tsp oil)",
    calories: 610,
    proteinG: 54,
    fatG: 10,
    carbsG: 76,
  },
  {
    id: "prepost-whey-bread-pb",
    mealSlot: "Pre/Post-Workout",
    foodName: "1 Scoop Whey + 2 Slices Bread + 15g PB",
    portion: "full snack",
    calories: 345,
    proteinG: 32,
    fatG: 9,
    carbsG: 34,
  },
  {
    id: "dinner-chicken-rotis-dahi",
    mealSlot: "Dinner",
    foodName: "120g Chicken Breast + 2 Rotis + Green Sabzi + 100g Dahi",
    portion: "full meal (1 tsp oil)",
    calories: 483,
    proteinG: 41,
    fatG: 11,
    carbsG: 55,
  },
  {
    id: "snack-soya-eggs",
    mealSlot: "Snack",
    foodName: "50g Soya Chunks + 2 Egg Whites (boiled)",
    portion: "1 serving",
    calories: 245,
    proteinG: 30,
    fatG: 5,
    carbsG: 20,
  },
];
