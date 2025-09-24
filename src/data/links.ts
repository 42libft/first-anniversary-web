export const linkExchangeCounts = {
  fromYou: 132,
  fromPartner: 118,
} as const

export const totalLinks =
  linkExchangeCounts.fromYou + linkExchangeCounts.fromPartner
