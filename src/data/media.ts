export const mediaExchangeCounts = {
  fromYou: 186,
  fromPartner: 174,
} as const

export const totalMedia =
  mediaExchangeCounts.fromYou + mediaExchangeCounts.fromPartner
