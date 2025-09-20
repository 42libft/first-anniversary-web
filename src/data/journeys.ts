import type { Journey } from '../types/journey'
import journeySource from './journeys.json' assert { type: 'json' }

type JourneyInput = Omit<Journey, 'distanceKm'>

type JourneyStepWithDistance = JourneyInput['steps'][number]

const computeJourneyDistance = (steps: JourneyStepWithDistance[]): number =>
  steps.reduce((total, step) => (step.type === 'move' ? total + step.distanceKm : total), 0)

const journeyDefinitions = journeySource as JourneyInput[]

export const journeys: Journey[] = journeyDefinitions.map((journey) => ({
  ...journey,
  distanceKm: computeJourneyDistance(journey.steps),
}))
