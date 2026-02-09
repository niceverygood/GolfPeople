#!/bin/bash
# 골프장 데이터 자동 업데이트 스크립트
# 사용법: ./update_golf_courses.sh

set -e  # 에러 발생 시 중단

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/golf_crawler_$(date +%Y%m%d_%H%M%S).log"

# 로그 디렉토리 생성
mkdir -p "$LOG_DIR"

echo "============================================" | tee -a "$LOG_FILE"
echo "골프장 데이터 업데이트 시작" | tee -a "$LOG_FILE"
echo "시각: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
echo "============================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 크롤러 실행
cd "$PROJECT_DIR"
python3 scripts/crawl_golf_courses.py 2>&1 | tee -a "$LOG_FILE"

# 결과 확인
if [ $? -eq 0 ]; then
    echo "" | tee -a "$LOG_FILE"
    echo "✅ 업데이트 성공!" | tee -a "$LOG_FILE"

    # Git 커밋 (선택사항)
    # echo "Git 커밋 생성..." | tee -a "$LOG_FILE"
    # git add src/data/golfCourses.json
    # git commit -m "chore: update golf courses data ($(date '+%Y-%m-%d'))"
    # git push

else
    echo "" | tee -a "$LOG_FILE"
    echo "❌ 업데이트 실패!" | tee -a "$LOG_FILE"
    exit 1
fi

echo "" | tee -a "$LOG_FILE"
echo "로그 파일: $LOG_FILE" | tee -a "$LOG_FILE"
