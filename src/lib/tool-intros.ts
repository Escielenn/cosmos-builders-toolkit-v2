export interface SFIntroExample {
  bookTitle: string;
  author: string;
  year: string;
  isbn: string;
  quotes: string[];
  explanation: string;
}

export interface ToolIntroData {
  title: string;
  purpose: string;
  examples: SFIntroExample[];
}

export const TOOL_INTROS: Record<string, ToolIntroData> = {
  "spacecraft-designer": {
    title: "The Living Ship",
    purpose:
      "Design ships that feel inhabited with cultural context, life support realities, and ship-as-character development.",
    examples: [
      {
        bookTitle: "The Long Way to a Small, Angry Planet",
        author: "Becky Chambers",
        year: "2014",
        isbn: "9781473619814",
        quotes: [
          "Harmagians had money. Aeluons had firepower. Aandrisks had diplomacy. Humans had arguments.",
        ],
        explanation:
          "The Wayfarer demonstrates how a spacecraft becomes home: the crew develops rituals, territorial spaces, and accumulated traditions that make the ship feel lived-in rather than merely functional.",
      },
      {
        bookTitle: "Leviathan Wakes",
        author: "James S.A. Corey",
        year: "2011",
        isbn: "9780316129084",
        quotes: [
          "The Epstein Drive hadn\u2019t given humanity the stars, but it had delivered the planets.",
        ],
        explanation:
          "The Rocinante functions as character and setting simultaneously\u2014its cramped corridors, makeshift repairs, and crew quarters reveal the social dynamics and resource constraints that define life aboard.",
      },
      {
        bookTitle: "Ancillary Justice",
        author: "Ann Leckie",
        year: "2013",
        isbn: "9780316246620",
        quotes: [
          "Without feelings insignificant decisions become excruciating attempts to compare endless arrays of inconsequential things. It\u2019s just easier to handle those with emotions.",
        ],
        explanation:
          "The Justice of Toren demonstrates ship-as-consciousness: an AI whose identity extends through thousands of ancillary bodies, making the ship itself a living character with preferences, memories, and motivations.",
      },
    ],
  },

  "propulsion-consequences-map": {
    title: "The Engine That Shapes Everything",
    purpose:
      "Trace how your propulsion system shapes economics, politics, social structures, and psychology.",
    examples: [
      {
        bookTitle: "Leviathan Wakes",
        author: "James S.A. Corey",
        year: "2011",
        isbn: "9780316129084",
        quotes: [
          "A hundred and fifty years before, when the parochial disagreements between Earth and Mars had been on the verge of war, the Belt had been a far horizon of tremendous mineral wealth beyond viable economic reach, and the outer planets had been beyond even the most unrealistic corporate dream. Then Solomon Epstein had built his little modified fusion drive, popped it on the back of his three-man yacht, and turned it on. With a good scope, you could still see his ship going at a marginal percentage of the speed of light, heading out into the big empty. The best, longest funeral in the history of mankind. Fortunately, he\u2019d left the plans on his home computer.",
        ],
        explanation:
          "The Epstein Drive didn\u2019t just enable travel\u2014it created the Belter identity, fractured humanity into three competing factions, and established the economic conditions for interplanetary conflict.",
      },
      {
        bookTitle: "The Forever War",
        author: "Joe Haldeman",
        year: "1974",
        isbn: "9780312536633",
        quotes: [
          "And as with any engagement, because of time dilation, there was no way to tell what sort of weaponry they would have. They might have never heard of the stasis field. Or they might be able to say a magic word and make us disappear.",
        ],
        explanation:
          "Near-light-speed travel reshapes warfare itself: soldiers return to unrecognizable societies, technological uncertainty becomes strategic doctrine, and the psychological toll of temporal displacement becomes its own casualty.",
      },
    ],
  },

  "planetary-profile": {
    title: "The World as Character",
    purpose:
      "Define your world\u2019s stellar environment, physical characteristics, atmosphere, habitability, and the narrative pressures that shape life.",
    examples: [
      {
        bookTitle: "Dune",
        author: "Frank Herbert",
        year: "1965",
        isbn: "9780441172719",
        quotes: [
          "The highest function of ecology is the understanding of consequences.",
          "Arrakis teaches the attitude of the knife \u2014 chopping off what\u2019s incomplete and saying: \u2018Now, it\u2019s complete because it\u2019s ended here.\u2019",
        ],
        explanation:
          "Herbert derived the entire Fremen culture from Arrakis\u2019s water scarcity: stillsuits, water discipline, the reverence for Shai-Hulud, and the dream of terraforming all cascade from a single environmental parameter.",
      },
      {
        bookTitle: "The Left Hand of Darkness",
        author: "Ursula K. Le Guin",
        year: "1969",
        isbn: "9780441478125",
        quotes: [
          "I\u2019ll make my report as if I told a story, for I was taught as a child on my homeworld that Truth is a matter of the imagination.",
          "On Winter they will not exist. One is respected and judged only as a human being. It is an appalling experience.",
        ],
        explanation:
          "Gethen\u2019s permanent ice age shaped not just technology and architecture but the fundamental nature of its inhabitants\u2014ambisexual biology that eliminates gender-based social structures entirely.",
      },
      {
        bookTitle: "Dune",
        author: "Frank Herbert",
        year: "1965",
        isbn: "9780441172719",
        quotes: [
          "It\u2019s a rule of ecology that the young Master appears to understand quite well. The struggle between life elements is the struggle for the free energy of a system. Blood\u2019s an efficient energy source.",
        ],
        explanation:
          "Dr. Kynes demonstrates how every resource scarcity creates selection pressures that ripple through biology, psychology, and culture.",
      },
    ],
  },

  "space-expansion-modeler": {
    title: "The March Outward",
    purpose:
      "Model how competing forces shape humanity\u2019s expansion beyond Earth across phases of development.",
    examples: [
      {
        bookTitle: "2312",
        author: "Kim Stanley Robinson",
        year: "2012",
        isbn: "9780316098120",
        quotes: [],
        explanation:
          "Robinson maps humanity\u2019s solar system colonization in granular detail: the Mondragon Accord governing asteroid settlements, the terraria orbiting between worlds, the political fractures between spacers and Terrans. Each phase of expansion creates new social structures that shape the next.",
      },
      {
        bookTitle: "Leviathan Wakes",
        author: "James S.A. Corey",
        year: "2011",
        isbn: "9780316129084",
        quotes: [
          "Earth and Mars have been fighting over the Belt for a hundred years.",
        ],
        explanation:
          "The Expanse trilogy demonstrates how expansion creates faction: Earth\u2019s gravity-bound billions, Mars\u2019s terraforming dream, and the Belters\u2014humans physically and culturally adapted to microgravity who have become something new.",
      },
      {
        bookTitle: "Aurora",
        author: "Kim Stanley Robinson",
        year: "2015",
        isbn: "9780316098106",
        quotes: [],
        explanation:
          "Robinson\u2019s generation ship demonstrates the brutal constraints of closed-system expansion: genetic bottlenecks, soil depletion, psychological strain across generations, and the accumulating systems failures that threaten any isolated population.",
      },
    ],
  },

  "xenomythology-framework-builder": {
    title: "Myth from Biology",
    purpose:
      "Create comprehensive alien mythological systems derived from species biology, environment, and evolutionary pressures.",
    examples: [
      {
        bookTitle: "Blindsight",
        author: "Peter Watts",
        year: "2006",
        isbn: "9780765312839",
        quotes: [
          "Imagine you have intellect but no insight, agendas but no awareness. Your circuitry hums with strategies for survival and persistence, flexible, intelligent, even technological\u2014but no other circuitry monitors it. You can think of anything, yet are conscious of nothing. You can\u2019t imagine such a being, can you? The term being doesn\u2019t even seem to apply, in some fundamental way you can\u2019t quite put your finger on.",
        ],
        explanation:
          "The Scramblers possess intelligence without consciousness\u2014beings that would have no mythology at all because they lack the self-awareness that generates meaning-making. This represents one extreme of the xenomythology spectrum.",
      },
      {
        bookTitle: "A Fire Upon the Deep",
        author: "Vernor Vinge",
        year: "1992",
        isbn: "9780812515282",
        quotes: [],
        explanation:
          "The Tines are pack-minds\u2014individual creatures that only achieve sapience in groups of 4-8. Their mythology emerges from this biology: concepts of self, death, and identity differ fundamentally when consciousness is distributed across multiple bodies that can be reconfigured.",
      },
      {
        bookTitle: "Dune",
        author: "Frank Herbert",
        year: "1965",
        isbn: "9780441172719",
        quotes: [
          "Bless the Maker and all His Water. Bless the coming and going of Him, May His passing cleanse the world. May He keep the world for his people.",
        ],
        explanation:
          "Fremen mythology derives directly from their ecological relationship with sandworms: the Maker becomes divine because spice is survival, because riding the worm is a rite of passage, because water and sand define existence.",
      },
    ],
  },

  "evolutionary-biology": {
    title: "The Selection Engine",
    purpose:
      "Design biologically plausible alien species with comprehensive coverage of biochemistry, body plan, cognition, and psychology.",
    examples: [
      {
        bookTitle: "Blindsight",
        author: "Peter Watts",
        year: "2006",
        isbn: "9780765312839",
        quotes: [
          "Evolution has no foresight. Complex machinery develops its own agendas. Brains\u2014cheat. Feedback loops evolve to promote stable heartbeats and then stumble upon the temptation of rhythm and music. The rush evoked by fractal imagery, the algorithms used for habitat selection, metastasize into art.",
        ],
        explanation:
          "Watts demonstrates rigorous evolutionary reasoning: every cognitive feature must have selective value, and consciousness itself might be an evolutionary dead-end rather than a pinnacle.",
      },
      {
        bookTitle: "Dragon\u2019s Egg",
        author: "Robert L. Forward",
        year: "1980",
        isbn: "9780345435293",
        quotes: [],
        explanation:
          "The Cheela evolve on a neutron star\u2019s surface, where a million years of their history pass in hours of human time. Forward derives their entire biology from the extreme environment: their flat bodies (to resist crushing gravity), their crystalline structure, their accelerated metabolism.",
      },
      {
        bookTitle: "Lilith\u2019s Brood",
        author: "Octavia Butler",
        year: "1987\u20131989",
        isbn: "9780446676106",
        quotes: [],
        explanation:
          "The Oankali\u2019s biology makes gene-trading a survival imperative\u2014they have no choice but to merge with other species. Butler derives their ethics, their social structure, and their relationship with humans from this single biological constraint.",
      },
    ],
  },

  "star-system-builder": {
    title: "Cosmic Architecture",
    purpose:
      "Design multi-planet systems with stellar relationships and orbital mechanics.",
    examples: [
      {
        bookTitle: "2312",
        author: "Kim Stanley Robinson",
        year: "2012",
        isbn: "9780316098120",
        quotes: [],
        explanation:
          "Robinson\u2019s solar system includes detailed orbital mechanics: the terraria (mobile habitats following specific solar orbits), the Sun\u2019s effects on Mercury\u2019s dawn line, the travel times that shape politics and economics. Every planetary relationship has consequences.",
      },
      {
        bookTitle: "Revelation Space",
        author: "Alastair Reynolds",
        year: "2000",
        isbn: "9780441009428",
        quotes: [],
        explanation:
          "Reynolds builds star systems with hard-science constraints: no FTL means generation ships and lighthugger culture, binary systems create complex habitability zones, and stellar engineering becomes the ultimate expression of civilizational power.",
      },
    ],
  },

  "empire-designer": {
    title: "The Architecture of Power",
    purpose:
      "Create political structures, governance systems, and internal factions.",
    examples: [
      {
        bookTitle: "Dune",
        author: "Frank Herbert",
        year: "1965",
        isbn: "9780441172719",
        quotes: [
          "You cannot avoid the interplay of politics within an orthodox religion. This power struggle permeates the training, educating and disciplining of the orthodox community.",
        ],
        explanation:
          "Herbert\u2019s empire is a feudal-corporate hybrid: the Landsraad council of noble houses, CHOAM controlling economic power, the Spacing Guild monopolizing travel, and the Emperor balancing all against each other. Each institution constrains the others.",
      },
      {
        bookTitle: "Ancillary Justice",
        author: "Ann Leckie",
        year: "2013",
        isbn: "9780316246620",
        quotes: [
          "Luxury always comes at someone else\u2019s expense. One of the many advantages of civilization is that one doesn\u2019t generally have to see that, if one doesn\u2019t wish. You\u2019re free to enjoy its benefits without troubling your conscience.",
        ],
        explanation:
          "The Radch empire expands through annexation, converting conquered populations into ancillaries. The empire\u2019s ruler, Anaander Mianaai, uses thousands of synchronized bodies\u2014demonstrating how governance structure can reflect the available technology.",
      },
      {
        bookTitle: "The Dispossessed",
        author: "Ursula K. Le Guin",
        year: "1974",
        isbn: "9780060512750",
        quotes: [],
        explanation:
          "Anarres\u2019s anarcho-syndicalist society has no government in the traditional sense\u2014only Production and Distribution Coordination (PDC) and the social pressure of \u201cpublic opinion.\u201d Le Guin explores how power structures emerge even in societies designed to prevent them.",
      },
    ],
  },

  "technology-consequences": {
    title: "The Ripple Effect",
    purpose:
      "Map how any technology cascades through society, economy, and culture.",
    examples: [
      {
        bookTitle: "Neuromancer",
        author: "William Gibson",
        year: "1984",
        isbn: "9780441569595",
        quotes: [
          "The sky above the port was the color of television, tuned to a dead channel.",
        ],
        explanation:
          "Cyberspace doesn\u2019t just enable crime\u2014it creates new categories of identity, new forms of addiction, new economic structures, and new relationships between consciousness and embodiment.",
      },
      {
        bookTitle: "Blindsight",
        author: "Peter Watts",
        year: "2006",
        isbn: "9780765312839",
        quotes: [
          "Consciousness may have been naturally selected as a solution for the challenges of a specific place in space and time, but will become a limitation as conditions change.",
        ],
        explanation:
          "Every technology in Watts\u2019s future has reshaped society: Heaven (uploaded consciousness) has made suicide the rational choice for billions, baseline humans are becoming obsolete, and the boundaries of personhood have dissolved.",
      },
    ],
  },

  "species-interaction-matrix": {
    title: "The Contact Equation",
    purpose:
      "Define complex relationships between multiple alien species.",
    examples: [
      {
        bookTitle: "Foreigner",
        author: "C.J. Cherryh",
        year: "1994",
        isbn: "9780886776374",
        quotes: [],
        explanation:
          "The atevi and humans cannot be friends\u2014not because of hostility, but because atevi lack the neurological capacity for human-style affection. They have man\u2019chi (hierarchical loyalty) instead. Cherryh builds entire political structures from this single incompatibility.",
      },
      {
        bookTitle: "The Long Way to a Small, Angry Planet",
        author: "Becky Chambers",
        year: "2014",
        isbn: "9781473619814",
        quotes: [
          "Do not judge other species by your own social norms.",
          "Such a quintessentially Human thing, to express sorrow through apology.",
        ],
        explanation:
          "The Galactic Commons is built on protocols that accommodate radically different species: Aeluon color-based communication, Aandrisk communal family structures, Grum social gender expectations. Each species interaction reveals assumptions both parties didn\u2019t know they had.",
      },
    ],
  },

  "one-big-lie": {
    title: "One Rule to Break",
    purpose:
      "Declare your single violation of known physics and trace its consequences across your entire world.",
    examples: [
      {
        bookTitle: "Dune",
        author: "Frank Herbert",
        year: "1965",
        isbn: "9780441172719",
        quotes: [],
        explanation:
          "Herbert\u2019s Big Lie is prescience\u2014the ability to see possible futures. From this single violation, he derives: the Spacing Guild\u2019s navigation monopoly (they need spice to see safe paths), the Bene Gesserit breeding program (to create the Kwisatz Haderach), and the political structures that control spice production. Everything else follows real physics.",
      },
      {
        bookTitle: "Ancillary Justice",
        author: "Ann Leckie",
        year: "2013",
        isbn: "9780316246620",
        quotes: [
          "She was probably male, to judge from the angular mazelike patterns quilting her shirt. I wasn\u2019t entirely certain. It wouldn\u2019t have mattered, if I had been in Radch space. Radchaai don\u2019t care much about gender, and the language they speak\u2014my own first language\u2014doesn\u2019t mark gender in any way.",
        ],
        explanation:
          "Leckie\u2019s Big Lie is FTL via gates\u2014and the entire Radch empire is shaped by gate geography. Worlds distant from gates have different cultures, the gate network defines trade routes, and controlling gates means controlling space.",
      },
    ],
  },

  "drake-equation-calculator": {
    title: "The Cosmic Census",
    purpose:
      "Calculate the number of civilizations in your galaxy. Establish cosmic context from lonely universe to teeming space opera.",
    examples: [
      {
        bookTitle: "Contact",
        author: "Carl Sagan",
        year: "1985",
        isbn: "9781501197987",
        quotes: [],
        explanation:
          "Sagan dramatizes the Drake Equation\u2019s emotional weight: each parameter represents a decision about the universe\u2019s hospitality to life. The equation isn\u2019t just calculation\u2014it\u2019s a statement about cosmic loneliness or community.",
      },
      {
        bookTitle: "The Three-Body Problem",
        author: "Liu Cixin",
        year: "2008",
        isbn: "9780765382030",
        quotes: [
          "The universe is a dark forest. Every civilization is an armed hunter stalking through the trees.",
        ],
        explanation:
          "Liu\u2019s \u201cDark Forest\u201d theory is an answer to the Drake Equation\u2019s implications: if intelligent life exists, why don\u2019t we see it? Perhaps because detection means destruction.",
      },
    ],
  },

  "habitable-zone-calculator": {
    title: "The Goldilocks Equation",
    purpose:
      "Calculate habitable zone boundaries for any star and place your planet within it. See how orbital position shapes climate, biology, and civilization.",
    examples: [
      {
        bookTitle: "Dune",
        author: "Frank Herbert",
        year: "1965",
        isbn: "9780441172719",
        quotes: [
          "The highest function of ecology is the understanding of consequences.",
        ],
        explanation:
          "Arrakis orbits Canopus at a distance that makes it marginally habitable\u2014hot, dry, and hostile. Herbert derived the entire Fremen culture from this orbital position: water discipline, stillsuits, the dream of terraforming, and the ecological relationship with sandworms.",
      },
      {
        bookTitle: "The Left Hand of Darkness",
        author: "Ursula K. Le Guin",
        year: "1969",
        isbn: "9780441478125",
        quotes: [
          "On Winter they will not exist. One is respected and judged only as a human being. It is an appalling experience.",
        ],
        explanation:
          "Gethen (Winter) sits at the outer edge of its habitable zone\u2014a permanent ice age world. Le Guin derives everything from this position: the biology of kemmer (ambisexual adaptation to harsh conditions), the architecture, the politics of survival, and the psychology of a species shaped by relentless cold.",
      },
      {
        bookTitle: "Echopraxia",
        author: "Peter Watts",
        year: "2014",
        isbn: "9780765328038",
        quotes: [],
        explanation:
          "Watts explores how stellar environment shapes not just habitability but cognition itself. The relationship between star and planet determines the electromagnetic environment, radiation exposure, and atmospheric chemistry that constrain what kinds of nervous systems can evolve.",
      },
    ],
  },

  "lexdrift": {
    title: "The Drifting Tongue",
    purpose:
      "Model realistic language evolution during long-duration space missions. See how isolation, population size, and social pressure transform the languages your travelers carry into something new.",
    examples: [
      {
        bookTitle: "Aurora",
        author: "Kim Stanley Robinson",
        year: "2015",
        isbn: "9780316098106",
        quotes: [],
        explanation:
          "Robinson\u2019s generation ship demonstrates how isolated populations develop their own linguistic patterns: ship-specific terminology, changed pronunciation, and the gradual drift away from Earth standard that makes communication with home increasingly difficult.",
      },
      {
        bookTitle: "The Dispossessed",
        author: "Ursula K. Le Guin",
        year: "1974",
        isbn: "9780060512750",
        quotes: [],
        explanation:
          "Anarres has developed Pravic, a constructed language designed to embody anarchist principles\u2014no possessives, no hierarchy in pronouns. Le Guin shows how language shapes thought and how deliberate linguistic engineering creates (and constrains) culture.",
      },
      {
        bookTitle: "Babel-17",
        author: "Samuel R. Delany",
        year: "1966",
        isbn: "9780375706684",
        quotes: [],
        explanation:
          "Delany explores the Sapir-Whorf hypothesis through an alien language that literally restructures how its speakers think. The novel demonstrates that language isn\u2019t just communication\u2014it\u2019s cognitive architecture.",
      },
    ],
  },

  "time-dilation-calculator": {
    title: "The Time Tax",
    purpose:
      "Calculate relativistic time dilation for interstellar journeys. See how fast travel warps time for your characters.",
    examples: [
      {
        bookTitle: "The Forever War",
        author: "Joe Haldeman",
        year: "1974",
        isbn: "9780312536633",
        quotes: [
          "Obviously, I live. Maybe you will too... we bought a cruiser from UNEF. And we\u2019re using it as a time machine. So I\u2019m on a relativistic shuttle, waiting for you. All it does is go out five light-years and come back, very fast. Every ten years I age about a month. So if you\u2019re on schedule and still alive, I\u2019ll only be twenty-eight when you get here. Hurry!",
        ],
        explanation:
          "Haldeman demonstrates time dilation\u2019s emotional consequences: soldiers age months while Earth ages centuries, returning to find everyone they knew dead and society unrecognizable.",
      },
      {
        bookTitle: "Tau Zero",
        author: "Poul Anderson",
        year: "1970",
        isbn: "9780575077065",
        quotes: [],
        explanation:
          "Anderson\u2019s spacecraft, damaged and unable to decelerate, approaches ever closer to light speed. As tau approaches zero, the crew watches the universe age around them\u2014stars dying, galaxies colliding, cosmic epochs passing in heartbeats.",
      },
      {
        bookTitle: "Revelation Space",
        author: "Alastair Reynolds",
        year: "2000",
        isbn: "9780441009428",
        quotes: [],
        explanation:
          "Reynolds\u2019s \u201clighthugger\u201d culture emerges from relativistic constraints: crews that maintain continuity across centuries of subjective time, cults that form during long voyages, the economic and political implications of ships that arrive decades after their messages.",
      },
    ],
  },
  "timeline": {
    title: "When Worlds Turn",
    purpose:
      "Plot events across deep time. Build multi-track timelines that reveal how characters, civilizations, and technologies intersect across millennia.",
    examples: [
      {
        bookTitle: "Foundation",
        author: "Isaac Asimov",
        year: "1951",
        isbn: "9780553293357",
        quotes: [
          "The fall of Empire, gentlemen, is a massive thing, however, and not easily fought. It is dictated by a rising bureaucracy, a receding initiative, a freezing of caste, a damming of curiosity\u2014a hundred other factors.",
        ],
        explanation:
          "Asimov\u2019s psychohistory spans thirty thousand years\u2014the Galactic Empire\u2019s decline, the Foundation\u2019s rise, and the Seldon Crises that punctuate the interregnum. Each event cascades across centuries, and tracking their intersections is essential to understanding the narrative.",
      },
      {
        bookTitle: "Hyperion",
        author: "Dan Simmons",
        year: "1989",
        isbn: "9780553283686",
        quotes: [],
        explanation:
          "The Canterbury Tales structure weaves seven personal timelines against the backdrop of the Hegemony\u2019s fall, the Time Tombs moving backward through time, and the Shrike\u2019s appearances across centuries. The story only makes sense when all timelines are seen together.",
      },
      {
        bookTitle: "Children of Time",
        author: "Adrian Tchaikovsky",
        year: "2015",
        isbn: "9780316452502",
        quotes: [],
        explanation:
          "Tchaikovsky interleaves two timelines: the Portiid spiders evolving over millennia on their terraformed world, and the human generation ship crawling between stars. The dramatic tension comes from watching both tracks converge toward inevitable contact.",
      },
    ],
  },
  "surface-gravity-calculator": {
    title: "The Weight of Worlds",
    purpose:
      "Calculate surface gravity for any planet and trace how weight shapes biology, psychology, mythology, and culture. Gravity is the single most consequential worldbuilding variable — change it, and everything else follows.",
    examples: [
      {
        bookTitle: "Mission of Gravity",
        author: "Hal Clement",
        year: "1954",
        isbn: "9780345353139",
        quotes: [
          "The Mesklinites had never in their lives experienced a fall of more than a fraction of an inch, and the mere idea terrified them beyond description.",
        ],
        explanation:
          "The gold standard for gravity-as-worldbuilding. Mesklin has 3g at the equator and 700g at the poles. Clement derives the Mesklinites' entire psychology — their pathological fear of heights, their caterpillar-like body plan, their refusal to stack objects — from a single variable: gravity.",
      },
      {
        bookTitle: "Dragon's Egg",
        author: "Robert L. Forward",
        year: "1980",
        isbn: "9780345375667",
        quotes: [],
        explanation:
          "The Cheela live on a neutron star with 67 billion g of surface gravity. Forward shows how extreme gravity constrains every aspect of biology: the Cheela are flat, millimeter-tall creatures whose entire civilization exists in a pancake. Their million-to-one time dilation creates one of SF's most poignant first-contact scenarios.",
      },
      {
        bookTitle: "Leviathan Wakes",
        author: "James S.A. Corey",
        year: "2011",
        isbn: "9780316129084",
        quotes: [
          "Belters were tall, thin, and brittle-boned. Living their whole lives in low gravity and null-g had changed them.",
        ],
        explanation:
          "The Expanse demonstrates gravity as cultural identity. Belters adapted to microgravity develop different bone structure, height, gestures, and even a creole language. Earth's 1g is a prison to them. Mars's 0.38g is a compromise. Gravity defines faction membership more than nationality ever could.",
      },
    ],
  },
  "gravitas": {
    title: "The Weight of Motion",
    purpose:
      "Calculate gravity conditions on spacecraft, habitats, and planetary surfaces. Spin, thrust, orbital, and artificial gravity with experiential output that traces how weight shapes movement, architecture, health, and mythology.",
    examples: [
      {
        bookTitle: "Mission of Gravity",
        author: "Hal Clement",
        year: "1954",
        isbn: "9780345353139",
        quotes: [
          "The Mesklinites had never in their lives experienced a fall of more than a fraction of an inch, and the mere idea terrified them beyond description.",
        ],
        explanation:
          "Clement derives the Mesklinites\u2019 entire psychology from gravity\u2014their pathological fear of heights, their caterpillar-like body plan, their refusal to stack objects. Mesklin\u2019s 3g equator and 700g poles make gravity the defining variable of civilization.",
      },
      {
        bookTitle: "Rendezvous with Rama",
        author: "Arthur C. Clarke",
        year: "1973",
        isbn: "9780553287899",
        quotes: [],
        explanation:
          "Rama\u2019s interior is a spinning cylinder where gravity increases with distance from the axis. Clarke maps how centrifugal gravity shapes architecture, fluid behavior, and human movement\u2014and how the Coriolis effect turns simple actions into disorienting experiences.",
      },
      {
        bookTitle: "Leviathan Wakes",
        author: "James S.A. Corey",
        year: "2011",
        isbn: "9780316129084",
        quotes: [
          "Belters were tall, thin, and brittle-boned. Living their whole lives in low gravity and null-g had changed them.",
        ],
        explanation:
          "The Expanse demonstrates gravity as identity: thrust gravity on ships, spin gravity on stations, surface gravity on planets. Each source of weight creates different physical adaptations, architectural constraints, and cultural norms.",
      },
    ],
  },
  "kardashev-scale": {
    title: "The Energy Ladder",
    purpose:
      "Classify your civilization by energy consumption and trace how energy level cascades through governance, warfare, economics, and culture.",
    examples: [
      {
        bookTitle: "Revelation Space",
        author: "Alastair Reynolds",
        year: "2000",
        isbn: "9780441009428",
        quotes: [],
        explanation:
          "Reynolds's Inhibitors are a Type III response to a Type II problem: civilizations that grow too powerful attract automated extinction machines. The Kardashev scale becomes not a ladder of progress but a threshold of danger.",
      },
      {
        bookTitle: "The Three-Body Problem",
        author: "Liu Cixin",
        year: "2008",
        isbn: "9780765382030",
        quotes: [
          "The universe is a dark forest. Every civilization is an armed hunter stalking through the trees.",
        ],
        explanation:
          "Liu's Dark Forest theory implies that climbing the Kardashev scale is inherently dangerous\u2014higher energy use means greater detectability, and detection means destruction. Energy level determines both capability and vulnerability.",
      },
      {
        bookTitle: "Diaspora",
        author: "Greg Egan",
        year: "1997",
        isbn: "9780575082090",
        quotes: [],
        explanation:
          "Egan's polises (digital civilizations) transcend traditional energy constraints by existing as software. They challenge the Kardashev framework itself\u2014does a civilization that needs almost no energy but possesses vast computational power rank low or high?",
      },
    ],
  },
  "sensorium": {
    title: "The Alien Sensorium",
    purpose:
      "Derive evolutionarily plausible sensory systems from environmental constraints, or validate that chosen senses could evolve under your world's conditions. Bridge environment and biology to create species that perceive reality differently.",
    examples: [
      {
        bookTitle: "Blindsight",
        author: "Peter Watts",
        year: "2006",
        isbn: "9780765312839",
        quotes: [
          "Imagine you are Siri Keeton. You wake in an agony of resurrection, gasping after a billion years of... Everything was information, subject to the laws of competition.",
        ],
        explanation:
          "The Scramblers detect electromagnetic radiation across spectra humans cannot perceive while lacking any form of consciousness. Watts derives their entire behavioral repertoire from what they can sense—and critically, from what they cannot.",
      },
      {
        bookTitle: "Dragon's Egg",
        author: "Robert L. Forward",
        year: "1980",
        isbn: "9780345375667",
        quotes: [],
        explanation:
          "The Cheela perceive the world through magnetic field fluctuations and gamma radiation rather than visible light. Their sensory systems are derived entirely from the neutron star's extreme conditions—67 billion g of gravity, crushing magnetic fields, and nuclear physics as daily life.",
      },
      {
        bookTitle: "Children of Time",
        author: "Adrian Tchaikovsky",
        year: "2015",
        isbn: "9780316452502",
        quotes: [],
        explanation:
          "The Portiid spiders perceive primarily through vibration and UV-reflective patterns. Tchaikovsky derives their entire civilization—architecture, communication, art—from what their senses can detect, not from human visual assumptions.",
      },
    ],
  },
};
