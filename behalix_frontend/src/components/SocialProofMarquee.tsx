import { Star, Quote, Eye } from 'lucide-react';

/*
  FUTURE VISION showcase — what BeHalix will feel like at scale.

  LAYOUT: Vertical COLUMNS, each containing 2 cards stacked & touching.
  Columns are laid out in a horizontal row with gaps between them.
  The entire row scrolls right → left as one unit.

  Within a column the two cards share the same width and their
  edges touch — top card bottom-edge meets bottom card top-edge.
  Top card gets rounded top corners, bottom card gets rounded
  bottom corners. The touching edges are flat/square.
*/

/* ── Card types ───────────────────────────── */

type PhotoCard = {
  kind: 'photo';
  src: string;
  name?: string;
  caption?: string;
  hoverText?: string;
  w: number;
  h: number;
};

type TestimonialCard = {
  kind: 'testimonial';
  name: string;
  initials: string;
  quote: string;
  stars: number;
  w: number;
  h: number;
};

type CardData = PhotoCard | TestimonialCard;

/* ── Image helper ─────────────────────────── */
const u = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&crop=faces&auto=format&q=80`;

/* ── Column data ──────────────────────────── */
/*
  Each column = { w, top card, bottom card }.
  Top + bottom share the same width. Heights vary to create
  the staggered masonry feel:
    tall/short · short/tall · short/short · tall/short …

  ~6:1 photo-to-testimonial ratio (20 photos, 4 testimonials).
*/

type ColumnDef = {
  w: number;
  top: Omit<PhotoCard, 'w'> | Omit<TestimonialCard, 'w'>;
  bottom: Omit<PhotoCard, 'w'> | Omit<TestimonialCard, 'w'>;
};

const COLUMNS: ColumnDef[] = [
  // Col 1 — tall / short
  {
    w: 236,
    top: {
      kind: 'photo',
      src: u('1529156069898-49953e39b3ac', 500, 740),
      name: 'Dhruv & gang',
      caption: 'Weekend trek crew',
      hoverText: '"We meet every Saturday now"',
      h: 292,
    },
    bottom: {
      kind: 'photo',
      src: u('1511632765486-a01980e01a18', 500, 480),
      name: 'The Sunday crew',
      caption: 'Picnic at Kankaria',
      hoverText: '"We do this every month now"',
      h: 193,
    },
  },
  // Col 2 — short / tall
  {
    w: 226,
    top: {
      kind: 'photo',
      src: u('1583089892943-e02e5b017b6a', 500, 500),
      caption: 'Navratri night',
      hoverText: '"Garba under the stars"',
      h: 198,
    },
    bottom: {
      kind: 'photo',
      src: u('1574236170878-f66e35f83207', 500, 760),
      caption: 'Street food walk',
      hoverText: '"Best khaman dhokla of my life"',
      h: 298,
    },
  },
  // Col 3 — short / short
  {
    w: 252,
    top: {
      kind: 'photo',
      src: u('1522071820081-009f0129c71c', 500, 420),
      caption: 'Code & Coffee',
      h: 204,
    },
    bottom: {
      kind: 'photo',
      src: u('1540575467063-178a50c2df87', 500, 400),
      caption: 'Startup networking night',
      h: 188,
    },
  },
  // Col 4 — tall / short
  {
    w: 231,
    top: {
      kind: 'photo',
      src: u('1504609813442-a8924e83f76e', 500, 720),
      name: 'Riya Pandya',
      caption: 'Dance night out',
      hoverText: '"Best night of the year"',
      h: 287,
    },
    bottom: {
      kind: 'photo',
      src: u('1516939884455-1445c8652f83', 500, 480),
      name: 'Neel & Kavan',
      caption: 'The hug that started it all',
      hoverText: '"Met here, friends for life"',
      h: 198,
    },
  },
  // Col 5 — short / tall
  {
    w: 247,
    top: {
      kind: 'photo',
      src: u('1606567595334-d39972c85dbe', 500, 480),
      caption: 'Diwali vibes',
      hoverText: '"The city lights up, and so do we"',
      h: 198,
    },
    bottom: {
      kind: 'photo',
      src: u('1519671482749-fd09be7ccebf', 500, 720),
      caption: 'Holi celebration',
      hoverText: '"Colours and connections"',
      h: 287,
    },
  },
  // Col 6 — tall / short (testimonial top)
  {
    w: 242,
    top: {
      kind: 'testimonial',
      name: 'Jinal Shah',
      initials: 'JS',
      quote: 'Finally found my tribe. The chai-and-code meetup changed my weekends completely.',
      stars: 5,
      h: 265,
    },
    bottom: {
      kind: 'photo',
      src: u('1611371805429-8b5c1b2c34ba', 500, 460),
      caption: 'Board game night',
      h: 193,
    },
  },
  // Col 7 — short / tall (testimonial bottom)
  {
    w: 236,
    top: {
      kind: 'photo',
      src: u('1523580494863-6f3031224c94', 500, 480),
      name: 'Mitali & friends',
      caption: 'Sunday brunch meetup',
      hoverText: '"Found my Sunday ritual"',
      h: 204,
    },
    bottom: {
      kind: 'testimonial',
      name: 'Diya Raval',
      initials: 'DR',
      quote: 'I hosted my first women-only run. 40 people came. I cried happy tears after.',
      stars: 5,
      h: 276,
    },
  },
  // Col 8 — tall / short
  {
    w: 231,
    top: {
      kind: 'photo',
      src: u('1543269865-cbf427effbad', 500, 740),
      name: 'Darshan & Pooja',
      caption: 'Coffee conversations',
      hoverText: '"One meetup changed everything"',
      h: 292,
    },
    bottom: {
      kind: 'photo',
      src: u('1527529482837-4698179dc6ce', 500, 460),
      name: 'Kavya & Meera',
      caption: 'Pottery workshop',
      hoverText: '"We made mugs and memories"',
      h: 193,
    },
  },
  // Col 9 — short / short
  {
    w: 252,
    top: {
      kind: 'photo',
      src: u('1475721027785-f74eccf877e2', 500, 480),
      caption: 'Open mic night',
      hoverText: '"Sang in public for the first time"',
      h: 204,
    },
    bottom: {
      kind: 'photo',
      src: u('1517457373958-b7bdd4587205', 500, 420),
      caption: 'Morning run club',
      hoverText: '"5 AM never felt this good"',
      h: 188,
    },
  },
  // Col 10 — tall / short (testimonial top)
  {
    w: 226,
    top: {
      kind: 'testimonial',
      name: 'Parth Mehta',
      initials: 'PM',
      quote: 'Hosted my first event and 23 people showed up. The feeling was surreal.',
      stars: 5,
      h: 270,
    },
    bottom: {
      kind: 'photo',
      src: u('1496024840928-4c417adf211d', 500, 480),
      caption: 'Sunset jam session',
      hoverText: '"Guitar, chai, and strangers who stayed"',
      h: 198,
    },
  },
  // Col 11 — short / tall (testimonial bottom)
  {
    w: 242,
    top: {
      kind: 'photo',
      src: u('1551818255-e6e10975bc17', 500, 480),
      caption: 'Kite festival crew',
      hoverText: '"Uttarayan with strangers turned friends"',
      h: 198,
    },
    bottom: {
      kind: 'testimonial',
      name: 'Harsh Trivedi',
      initials: 'HT',
      quote: "My weekends used to be boring. Now I actually look forward to Saturdays — real people, real conversations.",
      stars: 5,
      h: 270,
    },
  },
  // Col 12 — tall / short
  {
    w: 231,
    top: {
      kind: 'photo',
      src: u('1517457373958-b7bdd4587205', 500, 720),
      name: 'Ananya & crew',
      caption: 'Sunrise yoga at Sabarmati',
      hoverText: '"The best way to start a Sunday"',
      h: 287,
    },
    bottom: {
      kind: 'photo',
      src: u('1504674900247-0877df9cc836', 500, 480),
      name: 'Rohan & friends',
      caption: 'Late night chai run',
      hoverText: '"3 AM conversations hit different"',
      h: 198,
    },
  },
];

/* ── Card components ──────────────────────── */

function PhotoCardUI({ card }: { card: PhotoCard }) {
  return (
    <div
      className="group relative rounded-xl overflow-hidden shrink-0 cursor-default select-none shadow-md"
      style={{ width: card.w, height: card.h }}
    >
      <img
        src={card.src}
        alt={card.caption ?? ''}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent p-3 pt-10">
        {card.name && (
          <p className="text-white text-sm font-semibold leading-tight">{card.name}</p>
        )}
        {card.caption && (
          <p className="text-white/65 text-xs mt-0.5">{card.caption}</p>
        )}
      </div>
      {card.hoverText && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Quote className="h-5 w-5 text-white/30 mb-2 rotate-180" />
          <p className="text-white text-sm font-medium text-center leading-snug italic">
            {card.hoverText}
          </p>
        </div>
      )}
    </div>
  );
}

function TestimonialCardUI({ card }: { card: TestimonialCard }) {
  return (
    <div
      className="group relative rounded-xl overflow-hidden shrink-0 cursor-default select-none bg-card border border-border/40 shadow-md hover:shadow-lg transition-shadow duration-400"
      style={{ width: card.w, height: card.h }}
    >
      <div className="flex flex-col h-full p-5">
        <div className="flex gap-0.5 mb-3">
          {Array.from({ length: card.stars }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="text-sm leading-relaxed text-foreground/75 flex-1">
          &ldquo;{card.quote}&rdquo;
        </p>
        <div className="flex items-center gap-2.5 mt-auto pt-3 border-t border-border/30">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-pink/20 to-brand-teal/20 flex items-center justify-center text-[11px] font-bold text-foreground/50 shrink-0">
            {card.initials}
          </div>
          <p className="text-sm font-semibold truncate">{card.name}</p>
        </div>
      </div>
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-pink via-brand-orange to-brand-teal scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>
  );
}

function RenderCard({ card }: { card: CardData }) {
  return card.kind === 'photo'
    ? <PhotoCardUI card={card} />
    : <TestimonialCardUI card={card} />;
}

/* ── Single column: two cards with spacing ── */

function MasonryColumn({ col, idx }: { col: ColumnDef; idx: number }) {
  const topCard = { ...col.top, w: col.w } as CardData;
  const bottomCard = { ...col.bottom, w: col.w } as CardData;

  return (
    <div className="masonry-col" key={idx}>
      <RenderCard card={topCard} />
      <RenderCard card={bottomCard} />
    </div>
  );
}

/* ── Main Section ─────────────────────────── */

export function SocialProofMarquee() {
  // Duplicate columns for seamless infinite loop
  const doubled = [...COLUMNS, ...COLUMNS];

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* Warm background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, oklch(0.94 0.04 25 / 0.35) 50%, oklch(0.92 0.06 15 / 0.5) 80%, oklch(0.90 0.04 30 / 0.3) 100%)',
        }}
      />

      {/* Header */}
      <div className="text-center mb-12 sm:mb-16 px-4 relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground mb-5 shadow-sm">
          <Eye className="h-3.5 w-3.5 text-brand-teal" />
          A glimpse into the future
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
          The future we&apos;re building
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base mt-3 max-w-xl mx-auto leading-relaxed">
          This is what BeHalix will feel like — real people forming real bonds
          over chai, treks, garba nights, and everything in between.
        </p>
      </div>

      {/* Masonry marquee — columns of 2 cards, scrolling right→left */}
      <div className="masonry-marquee relative z-10" style={{ '--marquee-speed': '120s' } as React.CSSProperties}>
        <div className="masonry-strip">
          {doubled.map((col, i) => (
            <MasonryColumn key={i} col={col} idx={i} />
          ))}
        </div>
      </div>

      {/* Bottom note */}
      <div className="text-center mt-12 sm:mt-16 px-4 relative z-10">
        <p className="text-xs text-muted-foreground/50 max-w-md mx-auto leading-relaxed">
          These moments represent the future we envision — a world where
          showing up for each other is the norm, not the exception.
        </p>
      </div>
    </section>
  );
}
