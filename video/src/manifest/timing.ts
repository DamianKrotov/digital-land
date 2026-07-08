// SINGLE SOURCE OF TRUTH for pacing, script, and mix levels.
// The owner's review loop edits THIS FILE ONLY:
//   - captions[] text  = the voiceover script (verbatim; it becomes the recording script)
//   - targetSec        = scene length in the animatic (final mode re-times from VO WAVs)
//   - musicVolume      = music duck level while the scene plays (0..1)
// Contest hard bounds (refs/rules.md): total must stay within 180–300 s —
// enforced in Root.tsx calculateMetadata; an overrun refuses to render.

export const FPS = 30;
export const HARD_MIN_SEC = 180;
export const HARD_MAX_SEC = 300;

export type SceneId = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7';

export interface Caption {
  text: string;
  startSec: number; // relative to scene start (animatic pacing hint)
}

export interface SceneSpec {
  id: SceneId;
  title: string;
  targetSec: number;
  voTailSec: number; // silence padding appended after measured VO (final mode)
  musicVolume: number;
  captions: Caption[];
}

export const SCENES: SceneSpec[] = [
  {
    id: 'S1',
    title: 'Cold open — the split',
    targetSec: 25,
    voTailSec: 0.8,
    musicVolume: 0.35,
    captions: [
      {startSec: 0.5, text: "In December 2025, Georgia's state auditors described a typical data-center complex."},
      {startSec: 5.5, text: 'The servers and electrical equipment inside it: one-point-eight-one billion dollars.'},
      {startSec: 10.5, text: 'The land underneath: twenty-six million.'},
      {startSec: 14.0, text: 'One of these gets a tax exemption worth billions a year. Guess which one.'},
      {startSec: 19.5, text: 'This is a story about land — and about who gets paid when the cloud touches the ground.'},
    ],
  },
  {
    id: 'S2',
    title: 'The savannah',
    targetSec: 35,
    voTailSec: 0.8,
    musicVolume: 0.2,
    captions: [
      {startSec: 0.5, text: 'In 1879, Henry George asked readers to imagine a settler on an unbounded savannah.'},
      {startSec: 5.5, text: 'Identical acres in every direction — so land is worth nothing. Then others arrive.'},
      {startSec: 11.0, text: 'Roads. Markets. A town. And the same acre, unchanged, starts making its owner wealthy.'},
      {startSec: 17.0, text: 'George wrote: "He has what, were he in a populous district, would make him rich; but he is very poor."'},
      {startSec: 23.5, text: "His point: land value isn't created by the owner. It's created by everyone else."},
      {startSec: 28.5, text: 'Which means you should be able to watch it appear — the moment everyone else shows up. In Georgia, right now, "everyone else" arrives as a data-center announcement.'},
    ],
  },
  {
    id: 'S3',
    title: 'The boom',
    targetSec: 45,
    voTailSec: 0.8,
    musicVolume: 0.2,
    captions: [
      {startSec: 0.5, text: 'I collected every Georgia data-center announcement I could verify — press releases, county filings, local news.'},
      {startSec: 7.0, text: 'Forty-eight of them, carrying over a hundred billion dollars in promised investment.'},
      {startSec: 12.0, text: 'Watch the decade unfold. A trickle around Atlanta. Then twenty twenty-three. Then the flood.'},
      {startSec: 19.0, text: 'Social Circle. Fayetteville. Rome. Newnan. Twiggs County — a five-billion-dollar campus in a county of eight thousand people.'},
      {startSec: 27.5, text: "The state's own auditors count sixty-three data centers running, thirty-five under construction, two hundred forty-nine more announced."},
      {startSec: 35.0, text: 'The Public Service Commission has certified nearly ten thousand megawatts of new power — eighty percent of it for data centers.'},
      {startSec: 41.0, text: 'If George is right, every one of these dots should move the land around it, the day the news lands.'},
    ],
  },
  {
    id: 'S4',
    title: 'The test — the flat line',
    targetSec: 58,
    voTailSec: 1.0,
    musicVolume: 0.15,
    captions: [
      {startSec: 0.5, text: 'So I tested it. Take every ZIP code that got an announcement — thirty-one of them —'},
      {startSec: 5.0, text: 'and compare each, month by month, against five hundred nineteen ZIP codes just like it that hadn\'t gotten theirs yet.'},
      {startSec: 12.0, text: 'Before running anything, I committed my predictions to a public record: prices might jump, they might fall, or nothing.'},
      {startSec: 19.5, text: "For two years before each announcement, the neighborhoods move in lockstep — that's what makes the comparison fair."},
      {startSec: 26.5, text: 'Then the announcement lands.'},
      {startSec: 30.5, text: 'And — nothing. Home values move about one percent, statistically indistinguishable from zero.'},
      {startSec: 37.5, text: 'I tried eleven variations: different control groups, a different price dataset, dropping the pandemic, dropping the mega-projects. Same flat line.'},
      {startSec: 46.0, text: 'I even fed the model hundreds of fake announcement dates. Nine times out of ten, pure noise beats the real thing.'},
      {startSec: 53.0, text: 'Whatever these announcements create, it is not showing up in the value of nearby homes.'},
    ],
  },
  {
    id: 'S5',
    title: 'Who pays',
    targetSec: 52,
    voTailSec: 0.8,
    musicVolume: 0.15,
    captions: [
      {startSec: 0.5, text: "So nothing happened, and nobody pays? Not quite. The money is real — it's just not in anyone's house price."},
      {startSec: 8.0, text: 'Georgia exempts data-center equipment from sales tax: two and a half billion dollars of public revenue this year, headed toward three.'},
      {startSec: 16.0, text: "The state's own audit concluded seventy percent of this construction would have happened without the exemption."},
      {startSec: 22.5, text: 'And the announcements themselves? Utilities nationwide now admit most of this promised demand may never arrive — Exelon expects only twenty-two percent of its pipeline to materialize.'},
      {startSec: 32.5, text: "If Georgia's certified load falls short, the bill for stranded power plants lands on a system households already backstop."},
      {startSec: 39.5, text: 'Run the scenarios, and that exposure ranges from two billion dollars to eight.'},
      {startSec: 44.5, text: 'Homeowners captured nothing I could measure. The public is underwriting billions. Privatized gains. Socialized losses.'},
    ],
  },
  {
    id: 'S6',
    title: 'The remedy',
    targetSec: 35,
    voTailSec: 0.8,
    musicVolume: 0.25,
    captions: [
      {startSec: 0.5, text: "Henry George's fix is almost embarrassingly simple. Don't tax the servers — that's capital, human effort; George would exempt every dollar of it."},
      {startSec: 9.0, text: 'Tax the land — the value that exists only because the community is there.'},
      {startSec: 14.0, text: 'If a data center truly lifts the ground beneath it, the public captures the lift automatically. If the boom never materializes, there is nothing to tax — and nobody to bail out.'},
      {startSec: 23.5, text: 'Georgia built the opposite machine: exempt the capital, let the land ride, and backstop the risk.'},
      {startSec: 29.0, text: 'A hundred and forty years later, the savannah has fiber under it. The question hasn\'t changed. Who should get paid for what everyone builds together?'},
    ],
  },
  {
    id: 'S7',
    title: 'Credits',
    targetSec: 18,
    voTailSec: 0.5,
    musicVolume: 0.3,
    captions: [
      {startSec: 0.5, text: 'Every number in this film comes from public records — and from code you can run yourself.'},
    ],
  },
];
