import React from 'react';

export interface BreadcrumbItem {
    id: number;
    name: string;
}

interface BreadcrumbProps {
    path: BreadcrumbItem[];                 // 예: [{id:1, name:'상식'}, {id:2, name:'세계지리'}]
    onRootClick: () => void;               // "홈" 클릭 시 호출
    onItemClick: (id: number) => void;     // 각 항목 클릭 시 호출
    className?: string;                    // 선택: 래퍼 커스텀 클래스
}

export default function BreadcrumbPage({
    path,
    onRootClick,
    onItemClick,
    className = '',
}: BreadcrumbProps) {
    if (!path || path.length === 0) return null;

    return (
        <nav className={`breadcrumb ${className}`} aria-label="Breadcrumb">
            <div className="breadcrumb-path">
                <span
                    className="breadcrumb-item"
                    onClick={onRootClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onRootClick()}
                    aria-label="홈으로 이동"
                >
                    홈
                </span>

                {path.map((item) => (
                    <React.Fragment key={item.id}>
                        <span className="breadcrumb-separator">{'>'}</span>
                        <span
                            className="breadcrumb-item"
                            onClick={() => onItemClick(item.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onItemClick(item.id)}
                            aria-label={`${item.name}로 이동`}
                        >
                            {item.name}
                        </span>
                    </React.Fragment>
                ))}
            </div>
        </nav>
    );
}