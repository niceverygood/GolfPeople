-- 조인에 우리팀 정보 + 원하는 상대 조건 컬럼 추가
ALTER TABLE joins ADD COLUMN IF NOT EXISTS our_team JSONB DEFAULT '[]';
ALTER TABLE joins ADD COLUMN IF NOT EXISTS wanted_conditions JSONB DEFAULT '[]';
ALTER TABLE joins ADD COLUMN IF NOT EXISTS recruit_count INTEGER DEFAULT 0;
