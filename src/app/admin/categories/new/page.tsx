// app/admin/categories/new/page.tsx
import { createCategoryAction } from '@/app/admin/actions';

export default function CategoryNewPage() {
    return (
        <div className="max-w-xl">
            <h1 className="text-2xl font-bold mb-6">카테고리 추가</h1>

            <form action={createCategoryAction} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1">카테고리 이름 *</label>
                    <input name="name" className="w-full border rounded p-2" placeholder="예: 일반상식" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">아이콘 (이모지/코드)</label>
                        <input name="icon" className="w-full border rounded p-2" placeholder="예: 🧠" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">색상</label>
                        <input name="color" className="w-full border rounded p-2" placeholder="예: blue" />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">추가</button>
                    <a href="/admin" className="px-4 py-2 bg-gray-200 rounded">취소</a>
                </div>
            </form>
        </div>
    );
}
