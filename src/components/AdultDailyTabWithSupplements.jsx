import AdultDailyTab from './AdultDailyTab'
import { adultDailyContent } from '../data/adultDailyContent'
import { adultDailyDay11 } from '../data/adultDailyDay11'
import { adultDailyDay12to15 } from '../data/adultDailyDay12to15'

const assetPaths = {
  11: {
    printPath: '/adult-daily/print/day-11-chest-pain-acs-red-flags.html',
    pdfPath: '/adult-daily/pdf/ClinicNote_D11_Chest_Pain_v1.2_FINAL.pdf',
    masterPath: '/adult-daily/master/day-11-chest-pain-acs-red-flags.md',
  },
  12: {
    printPath: '/adult-daily/print/day-12-palpitations-ecg-monitoring.html',
    pdfPath: '/adult-daily/pdf/ClinicNote_D12_Palpitations.pdf',
    masterPath: '/adult-daily/master/day-12-palpitations-ecg-monitoring.md',
  },
  13: {
    printPath: '/adult-daily/print/day-13-dizziness-bppv-orthostatic-central.html',
    pdfPath: '/adult-daily/pdf/ClinicNote_D13_Dizziness.pdf',
    masterPath: '/adult-daily/master/day-13-dizziness-bppv-orthostatic-central.md',
  },
  14: {
    printPath: '/adult-daily/print/day-14-syncope-presyncope-risk-referral.html',
    pdfPath: '/adult-daily/pdf/ClinicNote_D14_Syncope.pdf',
    masterPath: '/adult-daily/master/day-14-syncope-presyncope-risk-referral.md',
  },
  15: {
    printPath: '/adult-daily/print/day-15-leg-edema-dvt-hf-venous-medication.html',
    pdfPath: '/adult-daily/pdf/ClinicNote_D15_Leg_Edema.pdf',
    masterPath: '/adult-daily/master/day-15-leg-edema-dvt-hf-venous-medication.md',
  },
}

const supplementalCards = [...adultDailyDay11, ...adultDailyDay12to15].map(card => ({
  ...card,
  ...assetPaths[card.day],
}))

supplementalCards.forEach(card => {
  if (!adultDailyContent.some(item => item.day === card.day)) adultDailyContent.push(card)
})

adultDailyContent.sort((a, b) => a.day - b.day)

export default AdultDailyTab
