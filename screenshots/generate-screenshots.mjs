/**
 * 앱스토어/플레이스토어용 스크린샷 생성 스크립트
 * 
 * 실행: node screenshots/generate-screenshots.mjs
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 스크린샷 크기 설정
const SIZES = {
  // iPhone 15 Pro Max (App Store 6.7")
  'iphone-6.7': { width: 1290, height: 2796 },
  // iPhone 14 Plus / 13 Pro Max (App Store 6.5")
  'iphone-6.5': { width: 1284, height: 2778 },
  // Google Play Store (Phone)
  'android-phone': { width: 1080, height: 1920 },
};

// 생성할 스크린샷 목록
const SCREENSHOTS = [
  { name: 'screenshot-1-home', title: '홈 - 파트너 추천' },
  { name: 'screenshot-2-join', title: '조인 - 라운드 모집' },
  { name: 'screenshot-3-profile', title: '프로필' },
  { name: 'screenshot-4-store', title: '마커 스토어' },
  { name: 'screenshot-5-match', title: '라운딩 제안' },
];

async function generateScreenshots() {
  console.log('🎨 스크린샷 생성 시작...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  // 출력 폴더 생성
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  for (const [sizeName, size] of Object.entries(SIZES)) {
    console.log(`📱 ${sizeName} (${size.width}x${size.height}) 생성 중...`);
    
    const sizeDir = path.join(outputDir, sizeName);
    if (!fs.existsSync(sizeDir)) {
      fs.mkdirSync(sizeDir, { recursive: true });
    }
    
    for (const screenshot of SCREENSHOTS) {
      const page = await browser.newPage();
      
      // 뷰포트 설정
      await page.setViewport({
        width: size.width,
        height: size.height,
        deviceScaleFactor: 1
      });
      
      // HTML 파일 로드
      const htmlPath = path.join(__dirname, `${screenshot.name}.html`);
      await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
      
      // 스크린샷 저장
      const outputPath = path.join(sizeDir, `${screenshot.name}.png`);
      await page.screenshot({
        path: outputPath,
        type: 'png'
      });
      
      console.log(`  ✅ ${screenshot.name}.png`);
      
      await page.close();
    }
    
    console.log('');
  }
  
  await browser.close();
  
  console.log('🎉 스크린샷 생성 완료!\n');
  console.log('📁 출력 폴더: screenshots/output/');
  console.log('\n📱 앱스토어 업로드용:');
  console.log('   - iphone-6.7/ : iPhone 15 Pro Max (1290x2796)');
  console.log('   - iphone-6.5/ : iPhone 14 Plus (1284x2778)');
  console.log('\n🤖 플레이스토어 업로드용:');
  console.log('   - android-phone/ : Phone (1080x1920)');
}

generateScreenshots().catch(console.error);


