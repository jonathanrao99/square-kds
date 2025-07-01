import Link from 'next/link';

export const SimpleNavbar = () => (
  <header className="flex items-center justify-between text-[#181818] bg-white border-b border-[#eee] py-4 px-2 sticky top-0 z-30 shadow-md">
    <div className="flex items-center min-w-0">
      <Link href="/dashboard" className="text-2xl text-orange-500 hover:text-orange-400 px-3 py-1 rounded-full" aria-label="Back to Dashboard">
        &#8592;
      </Link>
    </div>
    <div className="flex-1 flex justify-center items-center min-w-0">
      <h1 className="text-3xl font-bold tracking-wider truncate text-center">Desi Flavors Katy KDS</h1>
    </div>
    <div className="w-12" /> {/* Spacer for symmetry */}
  </header>
); 