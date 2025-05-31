from pydantic import BaseModel
from typing import List
class Slide(BaseModel):
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
    uuid: str
    hymn_uuid: str
    lines: List[str] # list of lines
    searchWords: List[str] = [] # used on frontend for indexing and searching
    chords: List[list[str]] | None = None # list of chords for each line
    chords_pos: List[list[int]] | None = None # position described as where the chord is letter-wise in the line

class Tag(BaseModel):
    uuid: str
    name: str

class Hymn(BaseModel):
    uuid: str
    title: str | None
    author: str | None
    composer: str | None
    verses: List[str] = [] # store slide uuid
    chorus: List[str] = [] # store slide uuid
    slides_order: List[str] = [] # store slide ids in order of how to present them 
    tags: list[str] = [] # tags ids
    # lang: str = "ar"

class HymnsPack(BaseModel):
    uuid: str
    title: str | None
    author: str | None
    version: str 
    hymns_uuid: List[str] # hymns ids
    description: str | None
