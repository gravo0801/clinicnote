import AdultDailyTab from './AdultDailyTab'
import { adultDailyContent } from '../data/adultDailyContent'

const reader = day => `/adult-daily/print/study.html?day=${day}`
const pdf = day => `/api/study-pdf?day=${day}`

// Vite가 src/data/adultDailyDay*.js 파일을 자동 수집한다.
// 새 Day 파일을 추가할 때 이 컴포넌트의 기존 import/배열을 다시 쓰지 않아도 되므로
// 이전 Day가 누락되는 회귀(regression)를 방지한다.
const studyModules = import.meta.glob('../data/adultDailyDay*.js', { eager: true })

const supplementalCards = Object.values(studyModules)
  .flatMap(module => Object.values(module).filter(Array.isArray).flat())
  .filter(card => card && Number.isFinite(Number(card.day)))
  .map(card => ({
    ...card,
    printPath: card.printPath || reader(card.day),
    pdfPath: card.pdfPath || pdf(card.day),
  }))

supplementalCards.forEach(card => {
  const existingIndex = adultDailyContent.findIndex(item => Number(item.day) === Number(card.day))
  if (existingIndex >= 0) {
    // static study card가 이미 있으면 명시적인 supplemental 최신본을 우선한다.
    adultDailyContent[existingIndex] = { ...adultDailyContent[existingIndex], ...card }
  } else {
    adultDailyContent.push(card)
  }
})

adultDailyContent.sort((a, b) => a.day - b.day)

export default AdultDailyTab
