import React from "react";

export const HomePage = () => {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
			<header className="mb-6">
				<h1 className="text-3xl font-bold text-gray-800">Welcome</h1>
			</header>

			<main className="max-w-md p-6 bg-white rounded-lg shadow-md">
				<p className="text-gray-600 mb-4">
					Thanks for visiting my simple homepage.
				</p>
				<div className="flex justify-center">
					<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
						Get Started
					</button>
				</div>
			</main>

			<footer className="mt-8 text-sm text-gray-500">
				© 2025 Simple Homepage
			</footer>
		</div>
	);
};