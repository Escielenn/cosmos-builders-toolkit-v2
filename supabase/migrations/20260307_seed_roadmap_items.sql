-- ============================================================
-- Seed roadmap_items with all current "Coming Soon" tools
-- from the homepage
-- ============================================================

-- Tools / Worksheets
INSERT INTO public.roadmap_items (title, description, category, status, priority_order)
VALUES
  ('Character Development', 'Individual characters connected to your world—backstory, motivations, arcs, and relationships mapped to the civilizations and environments you''ve already built.', 'tool', 'planned', 10),
  ('AI Development', 'Explore artificial intelligence in your universe—emergence thresholds, alignment scenarios, substrate requirements, and societal consequences.', 'tool', 'planned', 20),
  ('Generation Ship Designer', 'Design self-sustaining interstellar arks—population genetics, closed-loop ecosystems, structural engineering, and multi-generational social drift.', 'tool', 'planned', 30),
  ('Quantum and Beyond', 'Technology beyond our understanding—speculative physics frameworks, exotic matter applications, and the narrative consequences of post-quantum civilizations.', 'tool', 'planned', 40),
  ('BDO: Big Dumb Object', 'Create megastructures and cosmic artifacts—Dyson swarms, ring worlds, Alderson disks, and the engineering constraints that make them feel real.', 'tool', 'planned', 50),
  ('K-Scale (Kardashev Scale)', 'Classify civilizations by energy consumption—from planetary to stellar to galactic harvesters, with cascading implications for culture and conflict.', 'tool', 'planned', 60);

-- Calculators
INSERT INTO public.roadmap_items (title, description, category, status, priority_order)
VALUES
  ('Warp Travel Calculator', 'Calculate warp-based journey parameters—Alcubierre metrics, energy requirements, causality constraints, and travel-time tables for your FTL framework.', 'tool', 'planned', 70),
  ('Orbital Mechanics / Year Calculator', 'Compute orbital periods, seasons, day lengths, and calendar systems from first principles—feed in your star and planet data, get back a working year.', 'tool', 'planned', 80),
  ('Atmosphere Composition Calculator', 'Model atmospheric compositions—gas ratios, pressure profiles, greenhouse effects, and habitability implications for any world in your system.', 'tool', 'planned', 90);

-- Cartographers (Simulators)
INSERT INTO public.roadmap_items (title, description, category, status, priority_order)
VALUES
  ('Solar System Cartographer', 'Map entire solar systems—orbital layouts, asteroid belts, Lagrange points, and transit routes visualized in an interactive orrery.', 'simulator', 'planned', 100),
  ('Planet / Moon Cartographer', 'Map planetary and lunar surfaces—terrain generation, biome placement, tectonic boundaries, and settlement overlays on a 3D globe.', 'simulator', 'planned', 110);
