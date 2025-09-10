import "server-only";
import { Pool } from "pg";

declare global {
    // 개발 중 HMR 시 중복 연결 방지
    // eslint-disable-next-line no-var
    var _pgPool: Pool | undefined;
}

export const pool =
    global._pgPool ??
    new Pool({
        host: 'localhost', //process.env.PGHOST,
        port: 5432, //Number(process.env.PGPORT ?? 5432),
        user: 'postgres', // process.env.PGUSER,
        password: '123', //process.env.PGPASSWORD,
        database: 'postgres', // process.env.PGDATABASE,
    });

if (process.env.NODE_ENV !== "production") {
    global._pgPool = pool;
}