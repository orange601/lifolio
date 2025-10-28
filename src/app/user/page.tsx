import { currentUser } from '@clerk/nextjs/server';
import { createOne, findAppUserByClerkId } from '@/core/repositroy/user/user.create.repo';

export default async function UserPage() {
    // 1. 현재 로그인된 사용자 정보 가져오기
    const user = await currentUser();
    if (!user) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const clerkId = user.id;
    const username = user.username;
    console.log()

    // 2. 기존 사용자인지 확인
    let appUser = await findAppUserByClerkId(clerkId);
    if (!appUser) {
        await createOne(clerkId, username!);
        console.log('User created successfully');
    }
    console.log('About to redirect');

    return (
        <main>
        </main>
    );
}