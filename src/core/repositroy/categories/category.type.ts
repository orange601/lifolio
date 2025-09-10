export type CategoryRowRaw = {
    id: string | number;
    parent_id: string | number | null;
    name: string;
    slug: string | null;
    created_at: string | null;
    description: string | null;
};

export interface FindAllCategories {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string | null;
    created_at: string | null;
    description: string | null;
};