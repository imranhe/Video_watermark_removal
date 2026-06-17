#!/usr/bin/env node
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runMigration(filePath, conn) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await conn.execute(statement);
      console.log(`✓ ${statement.substring(0, 80)}...`);
    } catch (err) {
      // Ignore duplicate column/table errors (idempotent)
      if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log(`⊘ 跳过 (已存在): ${statement.substring(0, 60)}...`);
      } else {
        console.error(`✗ 失败: ${statement.substring(0, 60)}...`);
        console.error(`  错误: ${err.message}`);
      }
    }
  }
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  // Create database if not exists
  const dbName = process.env.DB_NAME || 'video_remover';
  await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.execute(`USE \`${dbName}\``);

  console.log(`数据库: ${dbName}`);

  // Run init.sql
  const initPath = path.resolve(__dirname, '../../database/init.sql');
  if (fs.existsSync(initPath)) {
    console.log('\n执行 init.sql...');
    await runMigration(initPath, conn);
  }

  // Run migration-v2.sql
  const migrationPath = path.resolve(__dirname, '../../database/migration-v2.sql');
  if (fs.existsSync(migrationPath)) {
    console.log('\n执行 migration-v2.sql...');
    await runMigration(migrationPath, conn);
  }

  await conn.end();
  console.log('\n✓ 迁移完成');
}

main().catch(err => {
  console.error('迁移失败:', err);
  process.exit(1);
});
