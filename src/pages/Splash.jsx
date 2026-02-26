export default function Splash() {
  return (
    <div className="fixed inset-0 bg-gp-black flex items-center justify-center z-50">
      <div className="text-center">
        <img
          src="/android-chrome-512.png"
          alt=""
          width={80}
          height={80}
          className="rounded-[20px] mx-auto mb-6"
        />
        <div className="w-7 h-7 mx-auto border-2 border-gp-gold border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}
