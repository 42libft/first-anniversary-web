import { journeys } from './journeys'

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

export const messageTotals = {
  you: 20993,
  ally: 20966,
}

export const likeTotals = {
  you: 240,
  ally: 295,
}

export const linkTotals = {
  you: 578,
  ally: 2830,
}

export const mediaTotals = {
  you: 669,
  ally: 706,
}

export const photoTotals = {
  you: 394,
  ally: 706,
}

export const teamMetrics = {
  rank: 1,
  totalDaysTogether: 25,
}

const baseJourneyDistanceKm = journeys.reduce((total, journey) => total + journey.distanceKm, 0)

export const journeyDistance = {
  baseKm: baseJourneyDistanceKm,
  additionalKm: 393,
  totalKm: baseJourneyDistanceKm + 393,
}

export const resultTotals = {
  messages: sum(Object.values(messageTotals)),
  likes: sum(Object.values(likeTotals)),
  links: sum(Object.values(linkTotals)),
  media: sum(Object.values(mediaTotals)),
}

export const QUIZ_TOTAL_COUNT = journeys.reduce((accumulator, journey) => {
  const quizSteps = journey.steps.filter((step) => step.type === 'question' && step.style === 'choice')
  return accumulator + quizSteps.length
}, 0)
