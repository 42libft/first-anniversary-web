export type DiffKind = 'context' | 'added' | 'removed'

export interface DiffLine {
  kind: DiffKind
  value: string
}

export const diffLines = (before: string, after: string): DiffLine[] => {
  const beforeLines = before.split('\n')
  const afterLines = after.split('\n')
  const m = beforeLines.length
  const n = afterLines.length
  const table: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (beforeLines[i] === afterLines[j]) {
        table[i][j] = table[i + 1][j + 1] + 1
      } else {
        table[i][j] = Math.max(table[i + 1][j], table[i][j + 1])
      }
    }
  }

  const diff: DiffLine[] = []
  let i = 0
  let j = 0

  while (i < m && j < n) {
    if (beforeLines[i] === afterLines[j]) {
      diff.push({ kind: 'context', value: beforeLines[i] })
      i += 1
      j += 1
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      diff.push({ kind: 'removed', value: beforeLines[i] })
      i += 1
    } else {
      diff.push({ kind: 'added', value: afterLines[j] })
      j += 1
    }
  }

  while (i < m) {
    diff.push({ kind: 'removed', value: beforeLines[i] })
    i += 1
  }

  while (j < n) {
    diff.push({ kind: 'added', value: afterLines[j] })
    j += 1
  }

  return diff
}
