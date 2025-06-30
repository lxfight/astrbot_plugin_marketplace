const { Client } = require('pg');

// 先连接到postgres数据库创建目标数据库
const adminClient = new Client({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '123456',
});

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'astrbot_plugins',
  user: 'postgres',
  password: '123456',
});

const createTablesSQL = `
-- 创建GPG相关表的SQL脚本

-- 创建UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建 gpg_keys 表
CREATE TABLE IF NOT EXISTS gpg_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_id VARCHAR(16) NOT NULL UNIQUE,
    fingerprint VARCHAR(40) NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    key_type VARCHAR(20) DEFAULT 'RSA',
    key_size INTEGER,
    user_ids JSON NOT NULL,
    creation_time TIMESTAMP NOT NULL,
    expiration_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'revoked', 'expired')),
    verification_token VARCHAR(64),
    verified_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建 plugin_signatures 表
CREATE TABLE IF NOT EXISTS plugin_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    gpg_key_id UUID REFERENCES gpg_keys(id) ON DELETE SET NULL,
    version VARCHAR(50) NOT NULL,
    signature_type VARCHAR(20) NOT NULL CHECK (signature_type IN ('commit', 'tag', 'release', 'metadata')),
    signature_data TEXT NOT NULL,
    signed_content_hash VARCHAR(64) NOT NULL,
    signer_key_id VARCHAR(16) NOT NULL,
    signer_fingerprint VARCHAR(40) NOT NULL,
    status VARCHAR(20) DEFAULT 'unknown_key' CHECK (status IN ('valid', 'invalid', 'expired', 'revoked', 'unknown_key')),
    verification_details JSON,
    verified_at TIMESTAMP,
    git_commit_hash VARCHAR(40),
    git_tag_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plugin_id, version, signature_type)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_gpg_keys_user_id ON gpg_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_plugin_signatures_plugin_id ON plugin_signatures(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_signatures_gpg_key_id ON plugin_signatures(gpg_key_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为表添加更新时间触发器
DROP TRIGGER IF EXISTS update_gpg_keys_updated_at ON gpg_keys;
CREATE TRIGGER update_gpg_keys_updated_at
    BEFORE UPDATE ON gpg_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plugin_signatures_updated_at ON plugin_signatures;
CREATE TRIGGER update_plugin_signatures_updated_at
    BEFORE UPDATE ON plugin_signatures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

async function createTables() {
  try {
    // 先创建数据库
    await adminClient.connect();
    console.log('Connected to PostgreSQL admin database');

    try {
      await adminClient.query('CREATE DATABASE astrbot_plugins');
      console.log('Database astrbot_plugins created successfully!');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('Database astrbot_plugins already exists');
      } else {
        throw error;
      }
    }
    await adminClient.end();

    // 连接到目标数据库创建表
    await client.connect();
    console.log('Connected to astrbot_plugins database');

    await client.query(createTablesSQL);
    console.log('GPG tables created successfully!');

  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await client.end();
  }
}

createTables();
