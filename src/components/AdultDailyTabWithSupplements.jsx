import AdultDailyTab from './AdultDailyTab'
import { adultDailyContent } from '../data/adultDailyContent'
import { adultDailyDay11 } from '../data/adultDailyDay11'
import { adultDailyDay12to15 } from '../data/adultDailyDay12to15'

const day12to15Cards = adultDailyDay12to15.map(({ pdfPath, ...card }) => card)

const supplementalCards = [
  ...adultDailyDay11,
  ...day12to15Cards,
]

supplementalCards.forEach(card => {
  if (!adultDailyContent.some(item => item.day === card.day)) {
    adultDailyContent.push(card)
  }
})

adultDailyContent.sort((a, b) => a.day - b.day)

export default AdultDailyTab
