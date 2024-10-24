
// Tasbe7na JSON Types
export type Tasbe7naHymns = Tasbe7naHymn[]

export interface Tasbe7naHymn {
    title: string
    formated?: boolean
    verses: string[][]
    chorusFirst?: boolean
    chorus?: string[]
}
