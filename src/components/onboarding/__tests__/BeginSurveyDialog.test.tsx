import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/components/world/IconPicker", () => ({ default: () => <span data-testid="icon-picker" /> }));

const mutate = vi.fn();
const reset = vi.fn();
let partialWorldId: string | null = null;
vi.mock("@/hooks/use-begin-survey", () => ({
  useBeginSurvey: () => ({ mutate, isPending: false, partialWorldId, reset }),
}));

const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

const navigate = vi.fn();
vi.mock("react-router-dom", async (orig) => ({
  ...(await orig<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));

import BeginSurveyDialog from "@/components/onboarding/BeginSurveyDialog";

function mount(onInitializeEmpty = vi.fn()) {
  const onOpenChange = vi.fn();
  render(
    <MemoryRouter>
      <BeginSurveyDialog open onOpenChange={onOpenChange} onInitializeEmpty={onInitializeEmpty} />
    </MemoryRouter>,
  );
  return { onOpenChange, onInitializeEmpty };
}

const next = () => fireEvent.click(screen.getByRole("button", { name: /^next:/i }));

beforeEach(() => {
  cleanup();
  mutate.mockReset();
  reset.mockReset();
  toast.mockReset();
  partialWorldId = null;
  navigate.mockReset();
});

describe("BeginSurveyDialog", () => {
  it("is titled Create a world and names its steps plainly", () => {
    mount();
    expect(screen.getByRole("heading", { name: "Create a world" })).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 4: Name")).toBeInTheDocument();
    for (const step of ["Name", "Star", "Planet", "Life"]) {
      expect(screen.getByRole("list", { name: "Steps" })).toHaveTextContent(step);
    }
    expect(screen.queryByText(/survey|designation|initialize/i)).toBeNull();
  });

  it("requires a name before the next step", () => {
    mount();
    const begin = screen.getByRole("button", { name: /next: choose a star/i });
    expect(begin).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: "Kellis" } });
    expect(begin).not.toBeDisabled();
  });

  it("creates a blank world from the first step", () => {
    const { onInitializeEmpty } = mount();
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: "Kellis" } });
    fireEvent.click(screen.getByRole("button", { name: /skip setup and create/i }));
    expect(onInitializeEmpty).toHaveBeenCalledWith({ name: "Kellis", icon: "globe", description: "" });
  });

  it("walks star, planet, life and creates the world, then opens its Bridge", () => {
    mount();
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: "Kellis" } });
    fireEvent.click(screen.getByRole("button", { name: /next: choose a star/i }));
    expect(screen.getByText("Step 2 of 4: Star")).toBeInTheDocument();

    // STAR: G2 preselected, derived readout shown; arrow keys move the choice.
    expect(screen.getByRole("radio", { name: /G2V/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Star readout")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("radio", { name: /G2V/ }), { key: "ArrowRight" });
    expect(screen.getByRole("radio", { name: /K0V/ })).toHaveAttribute("aria-checked", "true");
    next();

    // PLANET: pick the ocean world; habitable-zone verdict is in the readout.
    expect(screen.getByRole("button", { name: /next: add life/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /ocean world/i }));
    expect(screen.getByText("INSIDE")).toBeInTheDocument();
    next();

    // LIFE
    fireEvent.change(screen.getByLabelText(/species name/i), { target: { value: "Vethari" } });
    fireEvent.click(screen.getByRole("radio", { name: /radial/i }));
    fireEvent.change(screen.getByLabelText(/one line/i), { target: { value: "They sing in tides." } });
    fireEvent.click(screen.getByRole("button", { name: /^create world$/i }));

    expect(mutate).toHaveBeenCalledTimes(1);
    const [input, opts] = mutate.mock.calls[0];
    expect(input.choices).toEqual({
      worldName: "Kellis",
      star: { classId: "K0", name: "" },
      planet: { presetId: "ocean", name: "" },
      species: { name: "Vethari", bodyPlanId: "radial", line: "They sing in tides." },
    });
    opts.onSuccess({ worldId: "w-1", documentId: "doc-9" });
    expect(navigate).toHaveBeenCalledWith("/worlds/w-1");
  });

  it("skips steps: a skipped star and a skipped life step file as null", () => {
    mount();
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: "Kellis" } });
    fireEvent.click(screen.getByRole("button", { name: /next: choose a star/i }));
    fireEvent.click(screen.getByRole("button", { name: /^skip this step/i })); // star
    expect(screen.getByText(/No star chosen, so the orbit is left unset/)).toBeInTheDocument();
    next(); // planet (earth-like preselected)
    fireEvent.click(screen.getByRole("button", { name: /^skip and create/i })); // life → creates

    const [input] = mutate.mock.calls[0];
    expect(input.choices.star).toBeNull();
    expect(input.choices.planet).toEqual({ presetId: "earth-like", name: "" });
    expect(input.choices.species).toBeNull();
  });

  it("after a partial failure offers Retry (same mutation, resumed) and Open world", () => {
    partialWorldId = "w-7";
    mount();
    expect(screen.getByRole("alert")).toHaveTextContent("WORLD CREATED. SETUP INCOMPLETE.");
    expect(screen.queryByLabelText(/world name/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /^retry/i }));
    expect(mutate).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /open world/i }));
    expect(reset).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/worlds/w-7");
  });

  it("cancelling after a partial failure leaves the world and says so", () => {
    partialWorldId = "w-7";
    const { onOpenChange } = mount();
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "WORLD CREATED. SETUP INCOMPLETE." }));
    expect(reset).toHaveBeenCalled();
  });
});
