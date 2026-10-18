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

const next = () => fireEvent.click(screen.getByRole("button", { name: /^next/i }));

beforeEach(() => {
  cleanup();
  mutate.mockReset();
  reset.mockReset();
  toast.mockReset();
  partialWorldId = null;
  navigate.mockReset();
});

describe("BeginSurveyDialog", () => {
  it("requires a designation before the survey begins", () => {
    mount();
    const begin = screen.getByRole("button", { name: /begin survey/i });
    expect(begin).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: "Kellis" } });
    expect(begin).not.toBeDisabled();
  });

  it("keeps the empty-world path", () => {
    const { onInitializeEmpty } = mount();
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: "Kellis" } });
    fireEvent.click(screen.getByRole("button", { name: /initialize empty/i }));
    expect(onInitializeEmpty).toHaveBeenCalledWith({ name: "Kellis", icon: "globe", description: "" });
  });

  it("walks star, world, life and files the choices, then opens the document", () => {
    mount();
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: "Kellis" } });
    fireEvent.click(screen.getByRole("button", { name: /begin survey/i }));

    // STAR: G2 preselected, derived readout shown; arrow keys move the choice.
    expect(screen.getByRole("radio", { name: /G2V/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("STELLAR READOUT")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("radio", { name: /G2V/ }), { key: "ArrowRight" });
    expect(screen.getByRole("radio", { name: /K0V/ })).toHaveAttribute("aria-checked", "true");
    next();

    // WORLD: pick the ocean world; habitable-zone verdict is in the readout.
    fireEvent.click(screen.getByRole("radio", { name: /ocean world/i }));
    expect(screen.getByText("INSIDE")).toBeInTheDocument();
    next();

    // LIFE
    fireEvent.change(screen.getByLabelText(/species name/i), { target: { value: "Vethari" } });
    fireEvent.click(screen.getByRole("radio", { name: /radial/i }));
    fireEvent.change(screen.getByLabelText(/one line/i), { target: { value: "They sing in tides." } });
    fireEvent.click(screen.getByRole("button", { name: /file survey/i }));

    expect(mutate).toHaveBeenCalledTimes(1);
    const [input, opts] = mutate.mock.calls[0];
    expect(input.choices).toEqual({
      worldName: "Kellis",
      star: { classId: "K0", name: "" },
      planet: { presetId: "ocean", name: "" },
      species: { name: "Vethari", bodyPlanId: "radial", line: "They sing in tides." },
    });
    opts.onSuccess({ documentId: "doc-9" });
    expect(navigate).toHaveBeenCalledWith("/write/doc-9");
  });

  it("skips steps: a skipped star and a skipped life step file as null", () => {
    mount();
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: "Kellis" } });
    fireEvent.click(screen.getByRole("button", { name: /begin survey/i }));
    fireEvent.click(screen.getByRole("button", { name: /^skip/i })); // star
    expect(screen.getByText(/NO STAR ON FILE/)).toBeInTheDocument();
    next(); // world (earth-like preselected)
    fireEvent.click(screen.getByRole("button", { name: /^skip/i })); // life → files

    const [input] = mutate.mock.calls[0];
    expect(input.choices.star).toBeNull();
    expect(input.choices.planet).toEqual({ presetId: "earth-like", name: "" });
    expect(input.choices.species).toBeNull();
  });

  it("after a partial failure offers RETRY (same mutation, resumed) and OPEN WORLD", () => {
    partialWorldId = "w-7";
    mount();
    expect(screen.getByRole("alert")).toHaveTextContent("WORLD CREATED. SEEDING INCOMPLETE.");
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
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "WORLD CREATED. SEEDING INCOMPLETE." }));
    expect(reset).toHaveBeenCalled();
  });
});
