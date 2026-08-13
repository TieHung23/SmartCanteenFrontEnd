import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";

const CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snacks", "Drinks"];

const MOCK_MEALS = [
  {
    id: 1,
    name: "Corn chips nachos",
    calories: "250 kcal",
    weight: "250 gr",
    category: "Breakfast",
    tagColor: "bg-blue-400",
    image:
      "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 2,
    name: "Mexican tacos",
    calories: "220 kcal",
    weight: "200 gr",
    category: "Lunch",
    tagColor: "bg-green-400",
    image:
      "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 3,
    name: "Vegetable cream soup",
    calories: "180 kcal",
    weight: "250 gr",
    category: "Lunch",
    tagColor: "bg-purple-400",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 4,
    name: "Vegan vegetable salad",
    calories: "150 kcal",
    weight: "200 gr",
    category: "Dinner",
    tagColor: "bg-orange-400",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 5,
    name: "Roasted beef with potatoes",
    calories: "450 kcal",
    weight: "350 gr",
    category: "Dinner",
    tagColor: "bg-red-400",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 6,
    name: "Grilled beef steak & potatoes",
    calories: "520 kcal",
    weight: "350 gr",
    category: "Lunch",
    tagColor: "bg-indigo-400",
    image:
      "https://images.unsplash.com/photo-1432139555190-58524dae6a55?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
  },
];

export default function FeaturedMeals() {
  const [activeCategory, setActiveCategory] = useState("Lunch");

  return (
    <section className="w-full py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8">Featured meals</h2>

        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border-2 ${
                activeCategory === cat
                  ? "border-[#E86A33] text-[#E86A33] bg-orange-50/50 shadow-sm"
                  : "border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-800 bg-white shadow-sm"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {MOCK_MEALS.map((meal) => (
            <div
              key={meal.id}
              className="bg-white rounded-[2rem] p-4 flex flex-col gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group"
            >
              {/* Image Container */}
              <div className="relative w-full aspect-[4/3] rounded-[1.5rem] overflow-hidden bg-gray-100 flex items-center justify-center p-4">
                <Image
                  src={meal.image}
                  alt={meal.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Tag */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                  <span className={`w-1.5 h-1.5 rounded-full ${meal.tagColor}`} />
                  <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                    {meal.category}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex items-end justify-between pt-2 pb-1 px-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1 leading-tight">
                    {meal.name}
                  </h3>
                  <p className="text-xs font-semibold text-gray-400">
                    {meal.calories} • {meal.weight}
                  </p>
                </div>
                <button className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-orange-100 bg-[#fff4f0] text-[#E86A33] flex items-center justify-center hover:bg-[#E86A33] hover:text-white transition-colors">
                  <ShoppingBag className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Button */}
        <div className="mt-12">
          <Link
            href="/menu"
            className="flex items-center gap-3 bg-[#fff4f0] text-[#E86A33] hover:bg-[#ffe5d9] transition-colors px-6 py-2.5 rounded-full font-bold border border-orange-100 shadow-sm"
          >
            <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm">
              <ArrowRight className="w-4 h-4 text-[#E86A33]" />
            </span>
            Customize your own meal
          </Link>
        </div>
      </div>
    </section>
  );
}
