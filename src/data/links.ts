export const linkExchangeCounts = {
  fromYou: 578,
  fromPartner: 2830,
} as const

export const totalLinks =
  linkExchangeCounts.fromYou + linkExchangeCounts.fromPartner
