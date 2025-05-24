import React from 'react';

const TailwindTestPage = () => {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Tailwind CSS Test Page</h1>

      {/* Color Palette Tests */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Color Palette</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primary Colors */}
          <div>
            <h3 className="text-lg font-medium mb-2">Primary</h3>
            <div className="p-4 bg-primary text-white rounded">Primary (DEFAULT)</div>
            <div className="p-4 bg-primary-light text-black rounded mt-2">Primary Light</div>
            <div className="p-4 bg-primary-dark text-white rounded mt-2">Primary Dark</div>
          </div>

          {/* Secondary Colors */}
          <div>
            <h3 className="text-lg font-medium mb-2">Secondary</h3>
            <div className="p-4 bg-secondary text-white rounded">Secondary (DEFAULT)</div>
            <div className="p-4 bg-secondary-light text-black rounded mt-2">Secondary Light</div>
            <div className="p-4 bg-secondary-dark text-white rounded mt-2">Secondary Dark</div>
          </div>

          {/* Accent Colors */}
          <div>
            <h3 className="text-lg font-medium mb-2">Accent</h3>
            <div className="p-4 bg-accent text-white rounded">Accent (DEFAULT)</div>
            <div className="p-4 bg-accent-light text-black rounded mt-2">Accent Light</div>
            <div className="p-4 bg-accent-dark text-white rounded mt-2">Accent Dark</div>
          </div>

          {/* Background Colors */}
          <div>
            <h3 className="text-lg font-medium mb-2">Background</h3>
            <div className="p-4 bg-background text-black border rounded">Background (DEFAULT)</div>
            <div className="p-4 bg-background-dark text-white rounded mt-2">Background Dark</div>
          </div>

          {/* Surface Colors */}
          <div>
            <h3 className="text-lg font-medium mb-2">Surface</h3>
            <div className="p-4 bg-surface text-black border rounded">Surface (DEFAULT)</div>
            <div className="p-4 bg-surface-dark text-white rounded mt-2">Surface Dark</div>
          </div>
        </div>
      </section>

      {/* Standard Color Tests (from tailwindcss/colors) */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Standard Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Green</h3>
            <div className="p-4 bg-green-500 text-white rounded">Green 500</div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Orange</h3>
            <div className="p-4 bg-orange-500 text-white rounded">Orange 500</div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Red</h3>
            <div className="p-4 bg-red-500 text-white rounded">Red 500</div>
          </div>
           <div>
            <h3 className="text-lg font-medium mb-2">Gray</h3>
            <div className="p-4 bg-gray-500 text-white rounded">Gray 500</div>
          </div>
        </div>
      </section>

      {/* Explicit Custom Color Definitions */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Explicit Custom Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Custom Green</h3>
            <div className="p-4 bg-custom-green-500 text-white rounded">Custom Green 500</div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Custom Orange</h3>
            <div className="p-4 bg-custom-orange-500 text-white rounded">Custom Orange 500</div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Custom Red</h3>
            <div className="p-4 bg-custom-red-500 text-white rounded">Custom Red 500</div>
          </div>
        </div>
      </section>

      {/* Gradient Tests */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Gradients</h2>
        <div>
          <h3 className="text-lg font-medium mb-2">Gradient Animation</h3>
          <div className="p-8 h-32 w-full rounded bg-gradient-to-r from-gradient-indigo-500 via-gradient-purple-600 to-pink-500 animate-gradient">
            <span className="text-white font-bold">Animated Gradient (Indigo-500 to Purple-600 to Pink-500)</span>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Static Gradient with Primary/Secondary</h3>
           <div className="p-8 h-32 w-full rounded bg-gradient-to-r from-primary to-secondary">
            <span className="text-white font-bold">Static Gradient (Primary to Secondary)</span>
          </div>
        </div>
         <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Static Gradient with Explicit Custom Colors</h3>
           <div className="p-8 h-32 w-full rounded bg-gradient-to-r from-gradient-indigo-500 to-gradient-purple-600">
            <span className="text-white font-bold">Static Gradient (gradient-indigo-500 to gradient-purple-600)</span>
          </div>
        </div>
      </section>

      {/* Font Family Tests */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Font Families</h2>
        <p className="font-sans text-lg">Sans Serif Font (Inter, system-ui, sans-serif)</p>
        <p className="font-display text-lg mt-2">Display Font (Inter, system-ui, sans-serif)</p>
      </section>

      {/* Box Shadow Tests */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Box Shadows</h2>
        <div className="p-6 bg-surface rounded shadow-soft mt-2">Soft Shadow</div>
        <div className="p-6 bg-surface rounded shadow-glow mt-4">Glow Shadow (Note: Glow might be subtle)</div>
      </section>

      {/* Border Radius Tests */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Border Radius</h2>
        <div className="p-4 bg-primary text-white rounded-xl mt-2">Rounded XL</div>
        <div className="p-4 bg-secondary text-white rounded-2xl mt-2">Rounded 2XL</div>
      </section>

      {/* Animation Tests */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Animations</h2>
        <div className="p-4 bg-accent text-white rounded animate-fadeIn mt-2">FadeIn Animation</div>
        <div className="p-4 bg-primary text-white rounded animate-pulse mt-2">Pulse Animation</div>
      </section>

    </div>
  );
};

export default TailwindTestPage; 