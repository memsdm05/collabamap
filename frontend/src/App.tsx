import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center p-4 text-white">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center">Welcome to My React App</h1>
        <p className="text-xl opacity-80 mt-2 text-center">Built with React and Tailwind CSS</p>
      </header>

      <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="flex flex-col items-center">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="px-6 py-3 bg-white text-purple-700 rounded-lg font-semibold shadow-md hover:bg-purple-100 transition-colors mb-4"
          >
            Count is {count}
          </button>
          <p className="text-sm opacity-80">
            Edit <code className="bg-white/20 p-1 rounded">src/App.tsx</code> and save to test HMR
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-white/20 text-center">
          <p className="text-sm opacity-70">
            Click on the logos to learn more
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="https://reactjs.org" target="_blank" rel="noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
              React
            </a>
            <a href="https://tailwindcss.com" target="_blank" rel="noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
              Tailwind
            </a>
            <a href="https://vitejs.dev" target="_blank" rel="noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
              Vite
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App