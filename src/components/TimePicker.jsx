import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

// 시간 옵션 (05~15시)
const HOURS = Array.from({ length: 11 }, (_, i) => String(i + 5).padStart(2, '0'))
// 분 옵션 (00, 10, 20, 30, 40, 50)
const MINUTES = ['00', '10', '20', '30', '40', '50']

const ITEM_HEIGHT = 44

export default function TimePicker({ value, onChange }) {
  const [hour, minute] = value ? value.split(':') : ['07', '00']
  
  const handleHourChange = (newHour) => {
    onChange(`${newHour}:${minute}`)
  }
  
  const handleMinuteChange = (newMinute) => {
    onChange(`${hour}:${newMinute}`)
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {/* 시간 피커 */}
      <WheelPicker
        items={HOURS}
        value={hour}
        onChange={handleHourChange}
        suffix="시"
      />
      
      <span className="text-2xl font-bold text-gp-gold">:</span>
      
      {/* 분 피커 */}
      <WheelPicker
        items={MINUTES}
        value={minute}
        onChange={handleMinuteChange}
        suffix="분"
      />
    </div>
  )
}

function WheelPicker({ items, value, onChange, suffix }) {
  const containerRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const currentIndex = items.indexOf(value) !== -1 ? items.indexOf(value) : 0
  
  useEffect(() => {
    if (containerRef.current && !isDragging) {
      containerRef.current.scrollTo({
        top: currentIndex * ITEM_HEIGHT,
        behavior: 'smooth'
      })
    }
  }, [currentIndex, isDragging])

  const handleScroll = () => {
    if (!containerRef.current) return
    
    const scrollTop = containerRef.current.scrollTop
    const newIndex = Math.round(scrollTop / ITEM_HEIGHT)
    
    if (newIndex >= 0 && newIndex < items.length && items[newIndex] !== value) {
      onChange(items[newIndex])
    }
  }

  const handleScrollEnd = () => {
    setIsDragging(false)
    if (!containerRef.current) return
    
    const scrollTop = containerRef.current.scrollTop
    const newIndex = Math.round(scrollTop / ITEM_HEIGHT)
    
    // 스냅 효과
    containerRef.current.scrollTo({
      top: newIndex * ITEM_HEIGHT,
      behavior: 'smooth'
    })
  }

  return (
    <div className="relative">
      {/* 선택 하이라이트 */}
      <div 
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-11 bg-gp-gold/20 rounded-xl border border-gp-gold/30 pointer-events-none z-10"
      />
      
      {/* 상단 그라데이션 */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gp-black to-transparent pointer-events-none z-20" />
      
      {/* 하단 그라데이션 */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gp-black to-transparent pointer-events-none z-20" />
      
      {/* 스크롤 컨테이너 */}
      <div
        ref={containerRef}
        className="h-[132px] overflow-y-auto scroll-smooth"
        style={{ 
          scrollSnapType: 'y mandatory',
          paddingTop: ITEM_HEIGHT,
          paddingBottom: ITEM_HEIGHT,
        }}
        onScroll={handleScroll}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={handleScrollEnd}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={handleScrollEnd}
        onMouseLeave={() => isDragging && handleScrollEnd()}
      >
        {items.map((item, index) => {
          const isSelected = item === value
          
          return (
            <div
              key={item}
              className={`h-11 flex items-center justify-center transition-all duration-150 ${
                isSelected 
                  ? 'text-gp-gold text-2xl font-bold' 
                  : 'text-gp-text-secondary text-lg'
              }`}
              style={{ scrollSnapAlign: 'center' }}
              onClick={() => onChange(item)}
            >
              {item}{suffix}
            </div>
          )
        })}
      </div>
    </div>
  )
}




