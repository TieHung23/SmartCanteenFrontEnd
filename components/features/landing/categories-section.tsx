import React from "react";
import Image from "next/image";

const CATEGORIES_DATA = [
  {
    id: 1,
    name: "Breakfast",
    image:
      "https://images.unsplash.com/photo-1493770348161-369560ae357d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    bgClass: "bg-green-50",
  },
  {
    id: 2,
    name: "Salads",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    bgClass: "bg-blue-50",
  },
  {
    id: 3,
    name: "Soups",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    bgClass: "bg-red-50",
  },
  {
    id: 4,
    name: "Meats",
    image:
      "https://images.unsplash.com/photo-1432139555190-58524dae6a55?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    bgClass: "bg-orange-50",
  },
  {
    id: 5,
    name: "Drinks",
    image:
      "https://images.unsplash.com/photo-1543362906-acfc16c67564?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    bgClass: "bg-purple-50",
  },
];

export default function CategoriesSection() {
  return (
    <section className="w-full py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 text-center">
          Categories
        </h2>
        <p className="text-sm font-medium text-gray-500 text-center max-w-xl mb-12">
          Select from a wide range of freshly prepared meals, meats and snacks.
          <br className="hidden sm:block" />A new menu is available weekly!
        </p>

        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 w-full max-w-5xl">
          {CATEGORIES_DATA.map((cat) => (
            <div key={cat.id} className="group cursor-pointer flex flex-col items-center gap-4">
              <div
                className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center p-2 transition-transform duration-300 group-hover:-translate-y-2 ${cat.bgClass}`}
              >
                <div className="relative w-full h-full rounded-full overflow-hidden shadow-sm">
                  <Image src={cat.image} alt={cat.name} fill className="object-cover" />
                </div>
              </div>
              <span className="font-bold text-gray-800 text-sm group-hover:text-[#E86A33] transition-colors">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
