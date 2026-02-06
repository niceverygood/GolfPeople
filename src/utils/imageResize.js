/**
 * 클라이언트 사이드 이미지 리사이징/압축
 * 업로드 전 큰 이미지를 적절한 크기로 줄여 네트워크/스토리지 절약
 */

const MAX_WIDTH = 1024
const MAX_HEIGHT = 1024
const QUALITY = 0.8

/**
 * 이미지 파일을 리사이즈하여 data URL로 반환
 * @param {File} file - 원본 이미지 파일
 * @param {Object} options - { maxWidth, maxHeight, quality }
 * @returns {Promise<string>} - 리사이즈된 이미지 data URL
 */
export const resizeImage = (file, options = {}) => {
  const maxWidth = options.maxWidth || MAX_WIDTH
  const maxHeight = options.maxHeight || MAX_HEIGHT
  const quality = options.quality || QUALITY

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img

      // 리사이즈 필요 여부 확인
      if (width <= maxWidth && height <= maxHeight) {
        // 원본이 충분히 작으면 그래도 압축은 적용
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', quality))
        return
      }

      // 비율 유지하며 리사이즈
      const ratio = Math.min(maxWidth / width, maxHeight / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('이미지 로드 실패'))

    const reader = new FileReader()
    reader.onloadend = () => { img.src = reader.result }
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.readAsDataURL(file)
  })
}
