from pydantic import BaseModel
from typing import List

class HymnosPage(BaseModel):
    '''
    Example:
                        
            chords per line : list[str]
       -----------------^----------------     --
       | G      G7          C         G |      |
        Amazing Grace! (how sweet the sound)   |
                                D              |
        That saved a wretch like me!           |
        G        G7        C      G            |-> lines
        I once was lost, but now am found,     |
            Em         D     G                 |
        Was blind, but now I see.              |
                                              --
    '''
    lines: List[str] # list of lines
    chords: List[list[str]] # list of chords for each line
    chords_pos: List[list[int]] # position described as where the chord is letter-wise in the line


class HymnosHymn(BaseModel):
    title: str | None
    author: str | None
    verses: List[HymnosPage] | None
    chorus: HymnosPage | None
    chorusFirst: bool | None
