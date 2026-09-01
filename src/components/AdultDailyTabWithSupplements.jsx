import AdultDailyTab from './AdultDailyTab'
import { adultDailyContent } from '../data/adultDailyContent'
import { adultDailyDay11 } from '../data/adultDailyDay11'
import { adultDailyDay12to15 } from '../data/adultDailyDay12to15'
import { adultDailyDay16to17 } from '../data/adultDailyDay16to17'
import { adultDailyDay18 } from '../data/adultDailyDay18'

const reader = day => `/adult-daily/print/study.html?day=${day}`
const pdf = day => `/api/study-pdf?day=${day}`

const assetPaths = {
  11: {
    printPath: reader(11),
    pdfPath: pdf(11),
    masterPath: '/adult-daily/master/day-11-chest-pain-acs-red-flags.md',
  },
  12: {
    printPath: reader(12),
    pdfPath: pdf(12),
    masterPath: '/adult-daily/master/day-12-palpitations-ecg-monitoring.md',
  },
  13: {
    printPath: reader(13),
    pdfPath: pdf(13),
    masterPath: '/adult-daily/master/day-13-dizziness-bppv-orthostatic-central.md',
  },
  14: {
    printPath: reader(14),
    pdfPath: pdf(14),
    masterPath: '/adult-daily/master/day-14-syncope-presyncope-risk-referral.md',
  },
  15: {
    printPath: reader(15),
    pdfPath: pdf(15),
    masterPath: '/adult-daily/master/day-15-leg-edema-dvt-hf-venous-medication.md',
  },
  16: {
    printPath: reader(16),
    pdfPath: pdf(16),
    masterPath: '/adult-daily/master/day-16-gerd-dyspepsia.md',
  },
  17: {
    printPath: reader(17),
    pdfPath: pdf(17),
    masterPath: '/adult-daily/master/day-17-acute-abdominal-pain.md',
  },
  18: {
    printPath: reader(18),
    pdfPath: pdf(18),
    masterPath: '/adult-daily/master/day-18-diarrhea.md',
  },
}

const supplementalCards = [
  ...adultDailyDay11,
  ...adultDailyDay12to15,
  ...adultDailyDay16to17,
  ...adultDailyDay18,
].map(card => ({
  ...card,
  ...assetPaths[card.day],
}))

supplementalCards.forEach(card => {
  if (!adultDailyContent.some(item => item.day === card.day)) adultDailyContent.push(card)
})

adultDailyContent.sort((a, b) => a.day - b.day)

export default AdultDailyTab
