export const mediaExchangeCounts = {
  fromYou: 669,
  fromPartner: 706,
} as const

export const totalMedia =
  mediaExchangeCounts.fromYou + mediaExchangeCounts.fromPartner
