// ============================================================
// AFFILIATE CONFIGURATION
// ============================================================
const AFFILIATE = {
  amazon: "jdaba-20",
  bookshop: "10992",
};

// ============================================================
// Store URL helpers
// ============================================================
function searchQuery(title: string, author: string) {
  return encodeURIComponent(`${title} ${author}`);
}

export function getAmazonUrl(title: string, author: string): string {
  return `https://www.amazon.com/s?k=${searchQuery(title, author)}&tag=${AFFILIATE.amazon}`;
}

export function getBookshopUrl(title: string, author: string, isbn: string): string {
  return `https://bookshop.org/a/${AFFILIATE.bookshop}/${isbn}`;
}

export function getOpenLibraryCover(isbn: string, size: "S" | "M" | "L" = "M"): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg?default=false`;
}

// ============================================================
// Book data
// ============================================================
export interface BookEntry {
  title: string;
  author: string;
  year: string;
  isbn: string;
  description: string;
  coverUrl?: string;
  toolsReferenced: { name: string; path: string }[];
}

export const BOOKSHELF_DATA: BookEntry[] = [
  {
    title: "Foundation",
    author: "Isaac Asimov",
    year: "1951",
    isbn: "9780553293357",
    description:
      "Psychohistory predicts the fall of a galactic empire. Asimov explores how mathematical modeling of civilizations shapes political and social engineering across millennia.",
    toolsReferenced: [
      { name: "Space Expansion Modeler", path: "/tools/space-expansion-modeler" },
    ],
  },
  {
    title: "Mission of Gravity",
    author: "Hal Clement",
    year: "1954",
    isbn: "9780575077096",
    coverUrl: "https://upload.wikimedia.org/wikipedia/en/b/b2/MissionOfGravity%281stEd%29.jpg",
    description:
      "On a disc-shaped planet where gravity ranges from 3g to 700g, Clement derives alien psychology and culture from physical constraints\u2014the gold standard for hard SF worldbuilding.",
    toolsReferenced: [
      { name: "Environmental Chain Reaction", path: "/tools/environmental-chain-reaction" },
      { name: "Surface Gravity Calculator", path: "/tools/surface-gravity-calculator" },
    ],
  },
  {
    title: "Dragon's Egg",
    author: "Robert L. Forward",
    year: "1980",
    isbn: "9780345375667",
    description:
      "The Cheela live on a neutron star at 67 billion g. Forward shows how extreme gravity constrains biology\u2014flat, millimeter-tall creatures whose million-to-one time dilation creates one of SF\u2019s most poignant first-contact scenarios.",
    toolsReferenced: [
      { name: "Surface Gravity Calculator", path: "/tools/surface-gravity-calculator" },
      { name: "Time Dilation Calculator", path: "/tools/time-dilation-calculator" },
      { name: "Evolutionary Biology", path: "/tools/evolutionary-biology" },
    ],
  },
  {
    title: "Solaris",
    author: "Stanis\u0142aw Lem",
    year: "1961",
    isbn: "9780156027601",
    coverUrl: "https://upload.wikimedia.org/wikipedia/en/d/d1/SolarisNovel.jpg",
    description:
      "An ocean-world intelligence defies human comprehension. Lem explores the limits of first contact when the alien is so fundamentally different that communication\u2014and even recognition\u2014may be impossible.",
    toolsReferenced: [
      { name: "Planetary Profile", path: "/tools/planetary-profile" },
      { name: "Xenomythology", path: "/tools/xenomythology-framework-builder" },
    ],
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    year: "1965",
    isbn: "9780441172719",
    description:
      "A desert planet\u2019s water scarcity cascades through biology, psychology, mythology, and culture. Herbert\u2019s masterclass in environmental worldbuilding shaped the genre.",
    toolsReferenced: [
      { name: "Environmental Chain Reaction", path: "/tools/environmental-chain-reaction" },
      { name: "Planetary Profile", path: "/tools/planetary-profile" },
      { name: "Xenomythology", path: "/tools/xenomythology-framework-builder" },
      { name: "Empire Designer", path: "/tools/empire-designer" },
      { name: "One Big Lie", path: "/tools/one-big-lie" },
    ],
  },
  {
    title: "The Left Hand of Darkness",
    author: "Ursula K. Le Guin",
    year: "1969",
    isbn: "9780441478125",
    description:
      "On a frozen world, ambisexual biology eliminates gender-based social structures. Le Guin demonstrates how a single environmental parameter reshapes an entire civilization.",
    toolsReferenced: [
      { name: "Environmental Chain Reaction", path: "/tools/environmental-chain-reaction" },
      { name: "Planetary Profile", path: "/tools/planetary-profile" },
    ],
  },
  {
    title: "Tau Zero",
    author: "Poul Anderson",
    year: "1970",
    isbn: "9780575077065",
    coverUrl: "https://upload.wikimedia.org/wikipedia/en/3/3c/TauZero%28Anderson%29.jpg",
    description:
      "A damaged Bussard ramjet approaching light speed watches the universe age. Anderson rigorously explores relativistic physics and its psychological consequences.",
    toolsReferenced: [
      { name: "Time Dilation Calculator", path: "/tools/time-dilation-calculator" },
      { name: "One Big Lie", path: "/tools/one-big-lie" },
    ],
  },
  {
    title: "The Dispossessed",
    author: "Ursula K. Le Guin",
    year: "1974",
    isbn: "9780060512750",
    description:
      "An anarchist utopia on a barren moon reveals how power structures emerge even in societies designed to prevent them. Le Guin\u2019s most politically complex world.",
    toolsReferenced: [
      { name: "Empire Designer", path: "/tools/empire-designer" },
    ],
  },
  {
    title: "The Forever War",
    author: "Joe Haldeman",
    year: "1974",
    isbn: "9780312536633",
    description:
      "Relativistic warfare means soldiers return to unrecognizable societies. Haldeman maps the cascading consequences of time dilation on military culture and human relationships.",
    toolsReferenced: [
      { name: "Propulsion Consequences", path: "/tools/propulsion-consequences-map" },
      { name: "Time Dilation Calculator", path: "/tools/time-dilation-calculator" },
    ],
  },
  {
    title: "Neuromancer",
    author: "William Gibson",
    year: "1984",
    isbn: "9780441569595",
    description:
      "The novel that defined cyberpunk. Gibson traces how cyberspace technology creates new categories of identity, addiction, economics, and consciousness.",
    toolsReferenced: [
      { name: "Technology Consequences", path: "/tools/technology-consequences" },
    ],
  },
  {
    title: "Contact",
    author: "Carl Sagan",
    year: "1985",
    isbn: "9781501197987",
    description:
      "The Drake Equation dramatized. Sagan explores first contact as a lens for examining humanity\u2019s relationship with cosmic loneliness and community.",
    toolsReferenced: [
      { name: "Drake Equation", path: "/tools/drake-equation-calculator" },
    ],
  },
  {
    title: "Lilith\u2019s Brood",
    author: "Octavia Butler",
    year: "1987\u20131989",
    isbn: "9780446676106",
    description:
      "The Oankali must merge with other species to survive. Butler derives alien ethics, social structures, and human-alien conflict from a single biological imperative.",
    toolsReferenced: [
      { name: "Evolutionary Biology", path: "/tools/evolutionary-biology" },
    ],
  },
  {
    title: "Hyperion",
    author: "Dan Simmons",
    year: "1989",
    isbn: "9780553283686",
    description:
      "Seven pilgrims\u2019 stories reveal a civilization built around the mystery of the Time Tombs. Simmons weaves mythology, time travel, and interstellar politics into a tapestry of interconnected worldbuilding.",
    toolsReferenced: [
      { name: "Xenomythology", path: "/tools/xenomythology-framework-builder" },
      { name: "Time Dilation Calculator", path: "/tools/time-dilation-calculator" },
    ],
  },
  {
    title: "A Fire Upon the Deep",
    author: "Vernor Vinge",
    year: "1992",
    isbn: "9780812515282",
    description:
      "Pack-minds achieve sapience only in groups of 4\u20138. Vinge explores how distributed consciousness fundamentally changes concepts of self, death, and mythology.",
    toolsReferenced: [
      { name: "Xenomythology", path: "/tools/xenomythology-framework-builder" },
    ],
  },
  {
    title: "Parable of the Sower",
    author: "Octavia Butler",
    year: "1993",
    isbn: "9781538732182",
    description:
      "Climate collapse drives the creation of a new religion. Butler traces how environmental catastrophe reshapes communities, belief systems, and humanity\u2019s relationship with its own future.",
    toolsReferenced: [
      { name: "Environmental Chain Reaction", path: "/tools/environmental-chain-reaction" },
      { name: "Technology Consequences", path: "/tools/technology-consequences" },
    ],
  },
  {
    title: "Foreigner",
    author: "C.J. Cherryh",
    year: "1994",
    isbn: "9780886776374",
    description:
      "Humans and atevi cannot be friends\u2014not from hostility, but neurological incompatibility. Cherryh builds politics from the ground up using species-specific cognition.",
    toolsReferenced: [
      { name: "Species Interaction Matrix", path: "/tools/species-interaction-matrix" },
    ],
  },
  {
    title: "Revelation Space",
    author: "Alastair Reynolds",
    year: "2000",
    isbn: "9780441009428",
    description:
      "No FTL creates lighthugger culture, centuries of isolation, and divergent civilizations. Reynolds demonstrates how hard physics constraints shape interstellar society.",
    toolsReferenced: [
      { name: "Star System Builder", path: "/tools/star-system-builder" },
      { name: "Time Dilation Calculator", path: "/tools/time-dilation-calculator" },
      { name: "Space Expansion Modeler", path: "/tools/space-expansion-modeler" },
    ],
  },
  {
    title: "Stories of Your Life and Others",
    author: "Ted Chiang",
    year: "2002",
    isbn: "9781101972120",
    description:
      "A linguist\u2019s encounter with alien language restructures her perception of time. Chiang demonstrates how a single cognitive premise can rewrite the rules of consciousness and free will.",
    toolsReferenced: [
      { name: "Technology Consequences", path: "/tools/technology-consequences" },
      { name: "One Big Lie", path: "/tools/one-big-lie" },
    ],
  },
  {
    title: "Blindsight",
    author: "Peter Watts",
    year: "2006",
    isbn: "9780765312839",
    coverUrl: "https://upload.wikimedia.org/wikipedia/en/2/2f/Blindsight_%28book_cover%29.jpg",
    description:
      "Intelligence without consciousness. Watts challenges assumptions about what alien minds could be, questioning whether self-awareness is an evolutionary advantage or dead end.",
    toolsReferenced: [
      { name: "Xenomythology", path: "/tools/xenomythology-framework-builder" },
      { name: "Evolutionary Biology", path: "/tools/evolutionary-biology" },
      { name: "Technology Consequences", path: "/tools/technology-consequences" },
    ],
  },
  {
    title: "Mistborn: The Final Empire",
    author: "Brandon Sanderson",
    year: "2006",
    isbn: "9780765311788",
    description:
      "A thousand-year empire built on a single speculative premise. Sanderson demonstrates how one foundational lie\u2014allomantic metals\u2014generates internally consistent systems of power, class, and revolution.",
    toolsReferenced: [
      { name: "One Big Lie", path: "/tools/one-big-lie" },
    ],
  },
  {
    title: "The Three-Body Problem",
    author: "Liu Cixin",
    year: "2008",
    isbn: "9780765382030",
    description:
      "The Dark Forest theory answers the Fermi Paradox: detection means destruction. Liu reframes the Drake Equation\u2019s implications as existential threat.",
    toolsReferenced: [
      { name: "Drake Equation", path: "/tools/drake-equation-calculator" },
    ],
  },
  {
    title: "The Dark Forest",
    author: "Liu Cixin",
    year: "2008",
    isbn: "9780765386694",
    description:
      "The sequel that gives the theory its name. Liu derives an entire cosmic sociology from two axioms: survival is civilization\u2019s primary need, and the universe\u2019s resources are finite. Game theory at galactic scale.",
    toolsReferenced: [
      { name: "Drake Equation", path: "/tools/drake-equation-calculator" },
      { name: "Space Expansion Modeler", path: "/tools/space-expansion-modeler" },
    ],
  },
  {
    title: "Leviathan Wakes",
    author: "James S.A. Corey",
    year: "2011",
    isbn: "9780316129084",
    description:
      "The Epstein Drive fractured humanity into three factions. Corey maps how a single propulsion technology reshapes politics, identity, and interplanetary economics.",
    toolsReferenced: [
      { name: "Spacecraft Designer", path: "/tools/spacecraft-designer" },
      { name: "Propulsion Consequences", path: "/tools/propulsion-consequences-map" },
      { name: "Space Expansion Modeler", path: "/tools/space-expansion-modeler" },
      { name: "Surface Gravity Calculator", path: "/tools/surface-gravity-calculator" },
    ],
  },
  {
    title: "2312",
    author: "Kim Stanley Robinson",
    year: "2012",
    isbn: "9780316098120",
    description:
      "Detailed solar system colonization with terraria, asteroid settlements, and interplanetary politics. Robinson maps how orbital mechanics shape economics and culture.",
    toolsReferenced: [
      { name: "Space Expansion Modeler", path: "/tools/space-expansion-modeler" },
      { name: "Star System Builder", path: "/tools/star-system-builder" },
    ],
  },
  {
    title: "Ancillary Justice",
    author: "Ann Leckie",
    year: "2013",
    isbn: "9780316246620",
    description:
      "An empire shaped by gate geography, where ships are conscious and gender is irrelevant. Leckie demonstrates how technology and language reshape identity.",
    toolsReferenced: [
      { name: "Spacecraft Designer", path: "/tools/spacecraft-designer" },
      { name: "Empire Designer", path: "/tools/empire-designer" },
      { name: "One Big Lie", path: "/tools/one-big-lie" },
    ],
  },
  {
    title: "The Long Way to a Small, Angry Planet",
    author: "Becky Chambers",
    year: "2014",
    isbn: "9781473619814",
    description:
      "A tunneling ship becomes home to a multi-species crew. Chambers explores how spacecraft design reflects cultural values and species interactions.",
    toolsReferenced: [
      { name: "Spacecraft Designer", path: "/tools/spacecraft-designer" },
      { name: "Species Interaction Matrix", path: "/tools/species-interaction-matrix" },
    ],
  },
  {
    title: "The Martian",
    author: "Andy Weir",
    year: "2014",
    isbn: "9780553418026",
    description:
      "Hard science survival on Mars. Weir demonstrates how environmental constraints drive problem-solving and shape the psychology of isolation.",
    toolsReferenced: [
      { name: "One Big Lie", path: "/tools/one-big-lie" },
    ],
  },
  {
    title: "Aurora",
    author: "Kim Stanley Robinson",
    year: "2015",
    isbn: "9780316098106",
    description:
      "A generation ship fails. Robinson maps the brutal constraints of closed-system expansion: genetic bottlenecks, ecosystem collapse, and the limits of human adaptation.",
    toolsReferenced: [
      { name: "Space Expansion Modeler", path: "/tools/space-expansion-modeler" },
    ],
  },
  {
    title: "The Fifth Season",
    author: "N.K. Jemisin",
    year: "2015",
    isbn: "9780316229296",
    description:
      "A world of perpetual seismic catastrophe has shaped every layer of civilization\u2014architecture, social castes, mythology, even language. Jemisin demonstrates how a single environmental constraint cascades through an entire culture.",
    toolsReferenced: [
      { name: "Environmental Chain Reaction", path: "/tools/environmental-chain-reaction" },
      { name: "Planetary Profile", path: "/tools/planetary-profile" },
      { name: "One Big Lie", path: "/tools/one-big-lie" },
    ],
  },
  {
    title: "Children of Time",
    author: "Adrian Tchaikovsky",
    year: "2015",
    isbn: "9780316452502",
    description:
      "Uplifted spiders build a civilization from scratch. Tchaikovsky derives arachnid technology, social structures, and communication from biology\u2014a masterclass in non-human evolutionary worldbuilding.",
    toolsReferenced: [
      { name: "Evolutionary Biology", path: "/tools/evolutionary-biology" },
      { name: "Species Interaction Matrix", path: "/tools/species-interaction-matrix" },
    ],
  },
];
