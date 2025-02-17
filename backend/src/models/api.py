from typing import List
from pydantic import BaseModel
from models.hymnos import Hymn, HymnsPack, Slide

class HymnosItems(BaseModel):
    packs: List[HymnsPack]
    hymns: List[Hymn]
    slides: List[Slide]