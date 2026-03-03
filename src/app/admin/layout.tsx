import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-12">
      <aside className="col-span-2 bg-gray-50 border-r">
        <div className="p-4 font-bold text-blue-700">Admin</div>
        <nav className="p-2 space-y-2 text-sm">
          <Link className="block px-3 py-2 hover:bg-gray-100 rounded" href="/admin">
            Dashboard
          </Link>
          <Link className="block px-3 py-2 hover:bg-gray-100 rounded" href="/admin/questions/list">
            Questions
          </Link>
          <Link className="block px-3 py-2 hover:bg-gray-100 rounded" href="/admin/choice">
            Create MCQ
          </Link>
          <Link className="block px-3 py-2 hover:bg-gray-100 rounded" href="/admin/today">
            Create Subjective
          </Link>
          <Link className="block px-3 py-2 hover:bg-gray-100 rounded" href="/admin/categories/new">
            Categories
          </Link>
          <Link className="block px-3 py-2 hover:bg-gray-100 rounded" href="/admin/video-builder">
            Video Builder
          </Link>
          <Link className="block px-3 py-2 hover:bg-gray-100 rounded" href="/admin/video-jobs">
            Video Jobs
          </Link>
          <Link className="block px-3 py-2 hover:bg-gray-100 rounded" href="/admin/theme">
            Quiz Sets
          </Link>
        </nav>
      </aside>
      <main className="col-span-10 p-6">{children}</main>
    </div>
  );
}
