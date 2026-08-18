import AdultDailyTab from './AdultDailyTab'
import { adultDailyContent } from '../data/adultDailyContent'
import { adultDailyDay11 } from '../data/adultDailyDay11'

const supplementalCards = [
  ...adultDailyDay11,
]

supplementalCards.forEach(card => {
  if (!adultDailyContent.some(item => item.day === card.day)) {
    adultDailyContent.push(card)
  }
})

adultDailyContent.sort((a, b) => a.day - b.day)

export default AdultDailyTab
