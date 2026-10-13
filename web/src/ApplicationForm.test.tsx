import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ApplicationForm from "./ApplicationForm";
import { createApplication, updateApplication, type JobApplication } from "./api";

// Replace the API calls with mocks, so the tests never reach the real server
vi.mock("./api", () => ({
  createApplication: vi.fn(),
  updateApplication: vi.fn(),
}));

const existing: JobApplication = {
  id: 7,
  company: "Old Co",
  role: "Developer",
  status: "Offer",
  dateApplied: "2026-10-01",
  notes: "Follow up next week",
};

describe("ApplicationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation messages and does not call the API when fields are empty", async () => {
    const user = userEvent.setup();
    render(<ApplicationForm editing={null} onSaved={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Save application" }));

    expect(screen.getByText("Company is required.")).toBeInTheDocument();
    expect(screen.getByText("Role is required.")).toBeInTheDocument();
    expect(createApplication).not.toHaveBeenCalled();
  });

  it("treats whitespace-only company as empty", async () => {
    const user = userEvent.setup();
    render(<ApplicationForm editing={null} onSaved={vi.fn()} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Company"), "   ");
    await user.type(screen.getByLabelText("Role"), "Developer");
    await user.click(screen.getByRole("button", { name: "Save application" }));

    expect(screen.getByText("Company is required.")).toBeInTheDocument();
    expect(createApplication).not.toHaveBeenCalled();
  });

  it("creates an application with trimmed values and calls onSaved", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    vi.mocked(createApplication).mockResolvedValue({ ...existing, id: 1 });
    render(<ApplicationForm editing={null} onSaved={onSaved} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Company"), "  Acme  ");
    await user.type(screen.getByLabelText("Role"), "Engineer");
    await user.click(screen.getByRole("button", { name: "Save application" }));

    expect(createApplication).toHaveBeenCalledWith({
      company: "Acme",
      role: "Engineer",
      status: "Applied",
      dateApplied: expect.any(String),
      notes: null,
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("fills the form with the record and updates it in edit mode", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    vi.mocked(updateApplication).mockResolvedValue(existing);
    render(<ApplicationForm editing={existing} onSaved={onSaved} onCancel={vi.fn()} />);

    expect(screen.getByLabelText("Company")).toHaveValue("Old Co");
    expect(screen.getByLabelText("Status")).toHaveValue("Offer");
    expect(screen.getByRole("heading", { name: "Edit application" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Update application" }));

    expect(updateApplication).toHaveBeenCalledWith(7, {
      company: "Old Co",
      role: "Developer",
      status: "Offer",
      dateApplied: "2026-10-01",
      notes: "Follow up next week",
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Cancel is clicked in edit mode", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ApplicationForm editing={existing} onSaved={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(updateApplication).not.toHaveBeenCalled();
  });

  it("does not show Cancel when adding a new application", () => {
    render(<ApplicationForm editing={null} onSaved={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });
});