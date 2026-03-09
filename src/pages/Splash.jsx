export default function Splash({ loaderOnly = false }) {
  const isAndroid = /Android/i.test(navigator.userAgent)

  return (
    <div className="fixed inset-0 bg-gp-black flex items-center justify-center z-50">
      <div className="text-center">
        {/* Android: 시스템 스플래시가 로고를 보여주므로 스피너만 */}
        {!isAndroid && !loaderOnly && (
          <img
            src="/android-chrome-512.png"
            alt=""
            width={80}
            height={80}
            className="rounded-[20px] mx-auto mb-6"
          />
        )}
        <div className="w-7 h-7 mx-auto border-2 border-gp-gold border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}
