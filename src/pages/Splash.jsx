import { motion } from 'framer-motion'

export default function Splash() {
  return (
    <div className="app-container flex items-center justify-center bg-gp-black">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center"
      >
        {/* 로고 */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6"
        >
          <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-gp-gold to-gp-gold-light flex items-center justify-center">
            <svg className="w-14 h-14 text-gp-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </motion.div>

        {/* 타이틀 */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-3xl font-bold font-display gold-gradient mb-2"
        >
          골프피플
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-gp-text-secondary text-sm"
        >
          라운딩 메이트를 만나다
        </motion.p>

        {/* 로딩 인디케이터 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-12"
        >
          <div className="w-8 h-8 mx-auto border-2 border-gp-gold border-t-transparent rounded-full animate-spin" />
        </motion.div>
      </motion.div>
    </div>
  )
}



