import { Scoreboard, type ScoreEvent } from "@/components/scoreboard"

const exampleRows: ScoreEvent[] = [
  {
    id: "EVT-1001",
    timestamp: "2026-11-14 23:01:12",
    speaker: {
      id: "speaker",
      label: "The_Human",
      confidence: 0.8424760898927971,
      probabilities: [
        { label: "The_Human", probability: 0.8424760898927971 },
        { label: "The_AI", probability: 0.15752391010720304 },
      ],
    },
    brutality_score: {
      id: "brutality_score",
      label: "1",
      confidence: 0.2608545092974519,
      probabilities: [
        { label: "0", probability: 0.18907067498013175 },
        { label: "1", probability: 0.2608545092974519 },
        { label: "2", probability: 0.13773234809461665 },
        { label: "3", probability: 0.14841184071974473 },
        { label: "4", probability: 0.11108222792414617 },
        { label: "5", probability: 0.15284839898390878 },
      ],
      expectedScore: 2.190125634262048,
    },
    turn_notes: "Example event row",
  },
  {
    id: "EVT-1002",
    timestamp: "2026-11-14 23:01:25",
    speaker: {
      id: "speaker",
      label: "The_AI",
      confidence: 0.8424760898927971,
      probabilities: [
        { label: "The_AI", probability: 0.8424760898927971 },
        { label: "The_Human", probability: 0.15752391010720304 },
      ],
    },
    brutality_score: {
      id: "brutality_score",
      label: "3",
      confidence: 0.14841184071974473,
      probabilities: [
        { label: "0", probability: 0.18907067498013175 },
        { label: "1", probability: 0.2608545092974519 },
        { label: "2", probability: 0.13773234809461665 },
        { label: "3", probability: 0.14841184071974473 },
        { label: "4", probability: 0.11108222792414617 },
        { label: "5", probability: 0.15284839898390878 },
      ],
      expectedScore: 2.190125634262048,
    },
    turn_notes: "AI example event row",
  },
  {
    id: "EVT-1003",
    timestamp: "2026-11-14 23:01:38",
    speaker: {
      id: "speaker",
      label: "The_Human",
    },
    transcript: "That was a good point. Let me explain what I meant before we continue.",
  },
]

export default function Page() {
  return <Scoreboard rows={exampleRows} />
}
