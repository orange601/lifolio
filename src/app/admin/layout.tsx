export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen grid grid-cols-12">
            <aside className="col-span-2 bg-gray-50 border-r">
                <div className="p-4 font-bold text-blue-700">Admin</div>
                <nav className="p-2 space-y-2 text-sm">
                    <a className="block px-3 py-2 hover:bg-gray-100 rounded" href="/admin">대시보드</a>
                    <a className="block px-3 py-2 hover:bg-gray-100 rounded" href="/admin/questions/20">문제 수정(예시)</a>
                    <a className="block px-3 py-2 hover:bg-gray-100 rounded" href="/admin/categories/new">카테고리 추가</a>
                    <a className="block px-3 py-2 hover:bg-gray-100 rounded" href="/admin/today">오늘</a>
                </nav>
            </aside>
            <main className="col-span-10 p-6">{children}</main>
        </div>
    );
}
