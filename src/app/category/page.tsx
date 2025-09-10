import { findAllCategories } from '@/core/repositroy/categories/category.repo';
import CategoryCascader from "@/app/category/components/CategoryCascader";

export const runtime = "nodejs";
export const revalidate = 0; // 항상 SSR. 필요 시 숫자 초(ISR)로 변경

export default async function CategoryPage() {

    const rows = await findAllCategories();
    return (
        <main>
            <CategoryCascader quizCategories={rows} />
        </main>
    );
}
