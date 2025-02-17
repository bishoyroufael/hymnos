/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface Hymn {
  uuid: string;
  title: string | null;
  author_words: string | null;
  author_music: string | null;
  verses?: string[];
  chorus?: string[];
  chorusFirst: boolean;
  tags?: string[];
}
export interface HymnsPack {
  uuid: string;
  title: string | null;
  author: string | null;
  version: string;
  hymns_uuid: string[];
  description: string | null;
}
/**
 * Example:
 *
 *         chords per line : list[str]
 *    -----------------^----------------     --
 *    | G      G7          C         G |      |
 *     Amazing Grace! (how sweet the sound)   |
 *                             D              |
 *     That saved a wretch like me!           |
 *     G        G7        C      G            |-> lines
 *     I once was lost, but now am found,     |
 *         Em         D     G                 |
 *     Was blind, but now I see.              |
 *                                           --
 */
export interface Slide {
  uuid: string;
  hymn_uuid: string;
  lines: string[];
  linesWords?: string[];
  chords?: string[][] | null;
  chords_pos?: number[][] | null;
}
export interface Tag {
  uuid: string;
  name: string;
}
