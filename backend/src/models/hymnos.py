from pydantic import BaseModel
from typing import List

class HymnosSlide(BaseModel):
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
    chords: List[list[str]] | None = None # list of chords for each line
    chords_pos: List[list[int]] | None = None # position described as where the chord is letter-wise in the line


class HymnosHymn(BaseModel):
    id: str
    title: str | None
    author_words: str | None
    author_music: str | None
    verses: List[HymnosSlide] = [] 
    chorus: List[HymnosSlide] = []
    chorusFirst: bool | None

class HymnosPack(BaseModel):
    id: str
    title: str | None
    author: str | None
    version: str 
    hymns: List[HymnosHymn]
    description: str | None


